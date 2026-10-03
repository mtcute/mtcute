import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { EarlyTimer } from './early-timer.js'

describe('EarlyTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('should emit before the given time', () => {
    const timer = new EarlyTimer()
    const handler = vi.fn()
    timer.onTimeout(handler)

    timer.emitBefore(performance.now() + 1000)

    vi.advanceTimersByTime(999)
    expect(handler).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(handler).toHaveBeenCalledOnce()
  })

  it('should reschedule to an earlier time', () => {
    const timer = new EarlyTimer()
    const handler = vi.fn()
    timer.onTimeout(handler)

    timer.emitBefore(performance.now() + 1000)
    timer.emitBefore(performance.now() + 500)

    vi.advanceTimersByTime(500)
    expect(handler).toHaveBeenCalledOnce()
    vi.advanceTimersByTime(1000)
    expect(handler).toHaveBeenCalledOnce()
  })

  it('should ignore rescheduling to a later time', () => {
    const timer = new EarlyTimer()
    const handler = vi.fn()
    timer.onTimeout(handler)

    timer.emitBefore(performance.now() + 500)
    timer.emitBefore(performance.now() + 1000)

    vi.advanceTimersByTime(500)
    expect(handler).toHaveBeenCalledOnce()
  })

  it('should not emit past-due deadlines synchronously', () => {
    const timer = new EarlyTimer()
    const handler = vi.fn()
    timer.onTimeout(handler)

    timer.emitBefore(performance.now() - 5)

    expect(handler).not.toHaveBeenCalled()
    vi.advanceTimersByTime(0)
    expect(handler).toHaveBeenCalledOnce()
  })

  it('should cancel an idle emission when reset', async () => {
    const timer = new EarlyTimer()
    const handler = vi.fn()
    timer.onTimeout(handler)

    timer.emitWhenIdle()
    timer.reset()
    await Promise.resolve()

    expect(handler).not.toHaveBeenCalled()
  })

  it('should supersede an earlier idle emission', async () => {
    const timer = new EarlyTimer()
    const handler = vi.fn()
    timer.onTimeout(handler)

    timer.emitWhenIdle()
    timer.emitWhenIdle()
    await Promise.resolve()

    expect(handler).toHaveBeenCalledOnce()
  })

  // https://github.com/mtcute/mtcute/issues/148
  it('should not recurse when re-armed with a past-due deadline and a frozen clock', () => {
    // simulate workerd, where performance.now() is frozen within a task
    const frozenNow = performance.now()
    vi.spyOn(performance, 'now').mockReturnValue(frozenNow)

    const timer = new EarlyTimer()
    let calls = 0
    timer.onTimeout(() => {
      calls += 1
      if (calls < 100) timer.emitBefore(frozenNow - 5)
    })

    timer.emitBefore(frozenNow - 5)

    expect(calls).toBe(0)
    expect(() => vi.runAllTimers()).not.toThrow()
    expect(calls).toBe(100)
  })
})
