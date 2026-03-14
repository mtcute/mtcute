import type { RpcTimerSpec } from './timers.js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TimersManager } from './timers.js'

function makeSpec(
  key: string,
  request: Record<string, unknown>,
  extra?: Partial<RpcTimerSpec>,
): RpcTimerSpec {
  return {
    kind: 'rpc',
    key,
    interval: 100,
    request: request as any,
    ...extra,
  }
}

describe('highlevel/managers/timers', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should execute rpc specs on an interval', async () => {
    const execute = vi.fn<typeof TimersManager.prototype['_executeRpc']>(async () => {})
    const timers = new TimersManager(execute)

    const spec = makeSpec('typing:1', { _: 'messages.setTyping' }, { startNow: true })
    await timers.upsert(spec)

    await vi.advanceTimersByTimeAsync(250)

    expect(execute).toHaveBeenCalledTimes(3) // startNow + 2 intervals
    expect(execute.mock.calls[0][0]).toEqual(spec)
    expect(execute.mock.calls[0][1]).toBeInstanceOf(AbortSignal)
  })

  it('should replace an existing timer when upserting the same key', async () => {
    const execute = vi.fn<typeof TimersManager.prototype['_executeRpc']>(async () => {})
    const timers = new TimersManager(execute)

    timers.upsertOwned('a', makeSpec('online', { _: 'account.updateStatus', offline: false }, { startNow: true }))

    await vi.advanceTimersByTimeAsync(120)

    execute.mockReset()

    timers.upsertOwned('b', makeSpec('online', { _: 'account.updateStatus', offline: true }, { startNow: true }))

    await vi.advanceTimersByTimeAsync(120)

    expect(execute).toHaveBeenCalledTimes(2) // startNow + interval
    expect(execute.mock.calls.every(([spec]) => spec.request._ === 'account.updateStatus' && spec.request.offline === true)).toBe(true)
  })

  it('should clear only timers owned by a released connection', async () => {
    const execute = vi.fn<typeof TimersManager.prototype['_executeRpc']>(async () => {})
    const timers = new TimersManager(execute)

    timers.upsertOwned('a', makeSpec('typing:1', { _: 'messages.setTyping' }))
    timers.upsertOwned('b', makeSpec('typing:2', { _: 'messages.setTyping' }))

    timers.clearOwner('a')

    await expect(timers.exists('typing:1')).resolves.toBe(false)
    await expect(timers.exists('typing:2')).resolves.toBe(true)

    await vi.advanceTimersByTimeAsync(120)

    expect(execute).toHaveBeenCalledTimes(1)
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'typing:2' }),
      expect.any(AbortSignal),
    )
  })

  it('should forward timer execution errors', async () => {
    const error = new Error('boom')
    const execute = vi.fn(async () => {
      throw error
    })
    const timers = new TimersManager(execute)
    const onError = vi.fn()

    timers.onError(onError)
    await timers.upsert(makeSpec('typing:1', { _: 'messages.setTyping' }, { startNow: true }))

    await vi.runOnlyPendingTimersAsync()

    expect(onError).toHaveBeenCalledWith(error)
  })
})
