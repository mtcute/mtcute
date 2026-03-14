import type { RpcTimerSpec } from '../managers/timers.js'

import { describe, expect, it, vi } from 'vitest'
import { WorkerTimersManager } from './timers.js'

class FakeInvoker {
  readonly upsert = vi.fn(async () => {})
  readonly cancel = vi.fn(async () => true)
  readonly exists = vi.fn(async () => true)

  makeBinder<T>(_target: string): <K extends keyof T>(method: K) => T[K] {
    return <K extends keyof T>(method: K) => {
      if (method === 'upsert') return this.upsert as T[K]
      if (method === 'cancel') return this.cancel as T[K]
      if (method === 'exists') return this.exists as T[K]

      throw new Error(`Unknown worker timer method: ${String(method)}`)
    }
  }
}

describe('worker/timers', () => {
  it('should proxy upsert calls to the worker', async () => {
    const invoker = new FakeInvoker()
    // eslint-disable-next-line ts/no-unsafe-argument
    const timers = new WorkerTimersManager(invoker as any)
    const spec: RpcTimerSpec = {
      kind: 'rpc',
      key: 'typing:1',
      interval: 5_000,
      // eslint-disable-next-line ts/no-unsafe-assignment
      request: { _: 'messages.setTyping', peer: { _: 'inputPeerSelf' }, action: { _: 'sendMessageTypingAction' } } as any,
      startNow: true,
    }

    await timers.upsert(spec)

    expect(invoker.upsert).toHaveBeenCalledWith(spec)
  })

  it('should proxy cancel and exists calls to the worker', async () => {
    const invoker = new FakeInvoker()
    // eslint-disable-next-line ts/no-unsafe-argument
    const timers = new WorkerTimersManager(invoker as any)

    await timers.cancel('typing:1')
    await expect(timers.exists('typing:1')).resolves.toBe(true)

    expect(invoker.cancel).toHaveBeenCalledWith('typing:1')
    expect(invoker.exists).toHaveBeenCalledWith('typing:1')
  })
})
