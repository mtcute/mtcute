import type { RpcCallMiddlewareContext } from '../network-manager.js'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { isTlRpcError } from '../../utils/type-assertions.js'
import { floodWaiter } from './flood-waiter.js'

const okResult = { _: 'messages.affectedMessages' }
const req = { _: 'messages.sendMessage' }

const floodErr = (n: number) => ({ _: 'mt_rpc_error', errorCode: 420, errorMessage: `FLOOD_WAIT_${n}` })

function makeManager() {
  return {
    params: { isPremium: false, stopSignal: new AbortController().signal },
    getPrimaryDcId: () => 2,
    _log: { warn: () => {} },
  } as unknown as RpcCallMiddlewareContext['manager']
}

function makeCtx(params?: object): RpcCallMiddlewareContext {
  return { request: req, params, manager: makeManager() } as unknown as RpcCallMiddlewareContext
}

describe('floodWaiter', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('passes a successful result through without retrying', async () => {
    const mw = floodWaiter({})
    const next = vi.fn(async () => okResult)
    expect(await mw(makeCtx(), next)).toBe(okResult)
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('retries after sleeping for FLOOD_WAIT seconds, then succeeds', async () => {
    vi.useFakeTimers()
    const mw = floodWaiter({})
    let calls = 0
    const next = async () => {
      calls++
      return calls === 1 ? floodErr(2) : okResult
    }

    const p = mw(makeCtx(), next)
    await vi.advanceTimersByTimeAsync(2000)
    expect(await p).toBe(okResult)
    expect(calls).toBe(2)
  })

  it('returns the error instead of sleeping when the wait exceeds the threshold', async () => {
    const mw = floodWaiter({ maxWait: 1000 })
    let calls = 0
    const next = async () => {
      calls++
      return floodErr(5)
    }

    const res = await mw(makeCtx(), next)
    expect(isTlRpcError(res)).toBe(true)
    expect(calls).toBe(1)
  })

  it('gives up after maxRetries', async () => {
    vi.useFakeTimers()
    const mw = floodWaiter({ maxRetries: 2 })
    let calls = 0
    const next = async () => {
      calls++
      return floodErr(1)
    }

    const p = mw(makeCtx(), next)
    await vi.advanceTimersByTimeAsync(5000)
    const res = await p
    expect(calls).toBe(3)
    expect((res as { errorMessage: string }).errorMessage).toBe('FLOOD_WAIT_1')
  })

  it('passes non-flood errors through', async () => {
    const mw = floodWaiter({})
    let calls = 0
    const next = async () => {
      calls++
      return { _: 'mt_rpc_error', errorCode: 400, errorMessage: 'BAD_REQUEST' }
    }

    const res = await mw(makeCtx(), next)
    expect((res as { errorMessage: string }).errorMessage).toBe('BAD_REQUEST')
    expect(calls).toBe(1)
  })

  it('short-circuits subsequent calls while a stored flood wait is active', async () => {
    vi.useFakeTimers()
    const mw = floodWaiter({ maxWait: 1000 })
    let calls = 0
    const next = async () => {
      calls++
      return floodErr(5)
    }

    await mw(makeCtx(), next)
    expect(calls).toBe(1)

    const res = await mw(makeCtx(), next)
    expect(calls).toBe(1)
    expect((res as { errorMessage: string }).errorMessage).toMatch(/^FLOOD_WAIT_/)
  })
})
