import type { RpcCallMiddlewareContext } from '../network-manager.js'
import { timers } from '@fuman/utils'
import { describe, expect, it, vi } from 'vitest'

import { mediaThrottle } from './media-throttle.js'

const okResult = { _: 'upload.file' }
function flush() {
  return new Promise<void>((resolve) => {
    timers.setTimeout(resolve, 0)
  })
}

function makeManager(over: { isPremium?: boolean } = {}) {
  return {
    params: { isPremium: over.isPremium ?? false, stopSignal: new AbortController().signal },
    getPrimaryDcId: () => 2,
    _log: { warn: () => {} },
  } as unknown as RpcCallMiddlewareContext['manager']
}

function makeCtx(request: object, params?: object, manager = makeManager()): RpcCallMiddlewareContext {
  return { request, params, manager } as unknown as RpcCallMiddlewareContext
}

function deferredNext() {
  let active = 0
  let maxActive = 0
  const releases: Array<(v: unknown) => void> = []

  return {
    next: () => {
      active++
      if (active > maxActive) maxActive = active
      return new Promise<unknown>((resolve) => {
        releases.push((v) => {
          active--
          resolve(v)
        })
      })
    },
    get active() {
      return active
    },
    get maxActive() {
      return maxActive
    },
    releaseOne(v: unknown = okResult) {
      releases.shift()?.(v)
    },
  }
}

const getFile = (limit: number) => ({ _: 'upload.getFile', limit })
const dlParams = { kind: 'download', dcId: 2 }

describe('mediaThrottle', () => {
  it('passes non-media requests through untouched', async () => {
    const mw = mediaThrottle()
    const next = vi.fn(async () => okResult)
    const res = await mw(makeCtx({ _: 'messages.sendMessage' }), next)
    expect(res).toBe(okResult)
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('caps concurrent in-flight bytes per (kind, dc)', async () => {
    const CHUNK = 1024
    const mw = mediaThrottle({ getResourceLimit: () => 2 * CHUNK })
    const g = deferredNext()

    const p1 = mw(makeCtx(getFile(CHUNK), dlParams), g.next)
    const p2 = mw(makeCtx(getFile(CHUNK), dlParams), g.next)
    const p3 = mw(makeCtx(getFile(CHUNK), dlParams), g.next)
    await flush()

    expect(g.active).toBe(2)
    expect(g.maxActive).toBe(2)

    g.releaseOne()
    await flush()
    expect(g.active).toBe(2)
    expect(g.maxActive).toBe(2)

    g.releaseOne()
    g.releaseOne()
    await Promise.all([p1, p2, p3])
    expect(g.active).toBe(0)
  })

  it('uses separate budgets per kind', async () => {
    const CHUNK = 1024
    const mw = mediaThrottle({ getResourceLimit: () => CHUNK })
    const g = deferredNext()

    const dl = mw(makeCtx(getFile(CHUNK), dlParams), g.next)
    const ul = mw(makeCtx({ _: 'upload.saveBigFilePart', bytes: new Uint8Array(CHUNK) }), g.next)
    await flush()

    expect(g.active).toBe(2)

    g.releaseOne()
    g.releaseOne()
    await Promise.all([dl, ul])
  })

  it('releases the budget even when the call throws', async () => {
    const CHUNK = 1024
    const mw = mediaThrottle({ getResourceLimit: () => CHUNK })

    await expect(
      mw(makeCtx(getFile(CHUNK), dlParams), async () => {
        throw new Error('boom')
      }),
    ).rejects.toThrow('boom')

    // budget must be free again, otherwise this would hang
    const res = await mw(makeCtx(getFile(CHUNK), dlParams), async () => okResult)
    expect(res).toBe(okResult)
  })

  it('does not release budget when acquisition is aborted', async () => {
    const CHUNK = 1024
    const mw = mediaThrottle({ getResourceLimit: () => CHUNK })
    const g = deferredNext()

    const a = mw(makeCtx(getFile(CHUNK), dlParams), g.next)
    await flush()
    expect(g.active).toBe(1)

    const ctl = new AbortController()
    const b = mw(makeCtx(getFile(CHUNK), { ...dlParams, abortSignal: ctl.signal }), g.next)
    await flush()
    expect(g.active).toBe(1)

    ctl.abort()
    await expect(b).rejects.toBeTruthy()

    // a still holds the only slot; if b had wrongly released, c would proceed (active === 2)
    const c = mw(makeCtx(getFile(CHUNK), dlParams), g.next)
    await flush()
    expect(g.active).toBe(1)

    g.releaseOne()
    await flush()
    expect(g.active).toBe(1)

    g.releaseOne()
    await Promise.all([a, c])
  })

  it('resolves the upload dc via getPrimaryDcId when not provided', async () => {
    const mw = mediaThrottle({ getResourceLimit: () => 1024 })
    const manager = makeManager()
    const spy = vi.spyOn(manager, 'getPrimaryDcId')
    const res = await mw(
      makeCtx({ _: 'upload.saveFilePart', bytes: new Uint8Array(512) }, undefined, manager),
      async () => okResult,
    )
    expect(res).toBe(okResult)
    expect(spy).toHaveBeenCalled()
  })

  it('passes kind and premium flag to getResourceLimit', async () => {
    const spy = vi.fn(() => 1 << 20)
    const mw = mediaThrottle({ getResourceLimit: spy })
    await mw(makeCtx(getFile(100), dlParams, makeManager({ isPremium: true })), async () => okResult)
    expect(spy).toHaveBeenCalledWith('download', true)
  })
})
