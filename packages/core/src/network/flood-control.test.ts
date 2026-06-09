import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  ConnectionFloodController,
  DEFAULT_FLOOD_LIMITS,
  DEFAULT_MTPROTO_ERROR_LIMITS,
  DEFAULT_SANITY_LIMITS,
  FloodControl,
} from './flood-control.js'

describe('FloodControl', () => {
  it('reports 0 wakeup when no events recorded', () => {
    const fc = new FloodControl([{ count: 5, windowMs: 10_000 }])
    expect(fc.getWakeupAt(0)).toBe(0)
  })

  it('blocks once count is hit', () => {
    const fc = new FloodControl([{ count: 3, windowMs: 1000 }])
    fc.addEvent(0)
    fc.addEvent(100)
    fc.addEvent(200)
    expect(fc.getWakeupAt(300)).toBe(1000)
  })

  it('lets events age out of the window', () => {
    const fc = new FloodControl([{ count: 1, windowMs: 1000 }])
    fc.addEvent(0)
    expect(fc.getWakeupAt(1000)).toBeLessThanOrEqual(1000)
    expect(fc.getWakeupAt(1001)).toBe(0)
  })

  it('honors the strictest of multiple rules', () => {
    // 1@1s, 4@2s, 8@3s — TDLib's burst limit
    const fc = new FloodControl(DEFAULT_FLOOD_LIMITS)

    // burst of 8 at t=0
    for (let i = 0; i < 8; i++) fc.addEvent(i)

    // 8@3s saturated, oldest at 0 → wakeup at 3000
    expect(fc.getWakeupAt(100)).toBe(3000)
  })

  it('prunes events older than the widest window', () => {
    const fc = new FloodControl([
      { count: 1, windowMs: 1000 },
      { count: 5, windowMs: 5000 },
    ])

    for (let t = 0; t <= 10_000; t += 100) fc.addEvent(t)

    // internal buffer must not retain events older than the largest window
    // (with some slack for the one event right at the boundary)
    // @ts-expect-error - reading private
    const oldest = fc._events[0]
    expect(oldest).toBeGreaterThan(10_000 - 5000 - 200)
  })

  it('reset clears history', () => {
    const fc = new FloodControl([{ count: 1, windowMs: 1000 }])
    fc.addEvent(0)
    fc.reset()
    expect(fc.getWakeupAt(0)).toBe(0)
  })

  it('throws when constructed with zero rules', () => {
    expect(() => new FloodControl([])).toThrow()
  })
})

describe('ConnectionFloodController', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
    vi.stubGlobal('performance', { now: () => Date.now() })
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('lets the first call through immediately', async () => {
    const c = new ConnectionFloodController()
    const start = Date.now()
    await c.wait()
    expect(Date.now() - start).toBe(0)
  })

  it('gates connects with the burst limiter', async () => {
    // TDLib burst limit lets 8 in 3s
    const c = new ConnectionFloodController({
      flood: DEFAULT_FLOOD_LIMITS,
      sanity: [{ count: 100, windowMs: 100_000 }], // disabled
    })

    const log: number[] = []
    for (let i = 0; i < 9; i++) {
      void (async () => {
        await c.wait()
        log.push(Date.now())
      })()
    }

    // 1/1s rule lets one through at each second boundary; 4/2s and 8/3s govern bursts.
    // After event at t=0, next allowed at t=1000 (1@1s rule).
    await vi.advanceTimersByTimeAsync(0)
    expect(log).toEqual([0])

    await vi.advanceTimersByTimeAsync(1000)
    expect(log).toEqual([0, 1000])

    await vi.advanceTimersByTimeAsync(1000)
    expect(log).toEqual([0, 1000, 2000])

    // by t=3000, 4 events in [1000,3000] window → 4@2s rule kicks in;
    // but 1@1s says ok at t=3000; 4@2s says wait until oldest-in-window+2s.
    // events recorded at 0,1000,2000 — at t=3000 the t=1000 event would be the oldest
    // still in 2s window (3000-2=1000), so 4@2s would already have inWindow=3 < 4. ok.
    await vi.advanceTimersByTimeAsync(1000)
    expect(log).toEqual([0, 1000, 2000, 3000])
  })

  it('sanity ceiling applies on top of the burst limiter', async () => {
    // sanity 5@10s is the absolute ceiling per TDLib defaults
    const c = new ConnectionFloodController({
      flood: [{ count: 100, windowMs: 100 }], // permissive
    })

    const log: number[] = []
    for (let i = 0; i < 7; i++) {
      void (async () => {
        await c.wait()
        log.push(Date.now())
      })()
    }

    await vi.advanceTimersByTimeAsync(0)
    expect(log).toHaveLength(5) // sanity caps at 5

    await vi.advanceTimersByTimeAsync(9999)
    expect(log).toHaveLength(5)

    await vi.advanceTimersByTimeAsync(1)
    expect(log).toHaveLength(7) // sanity window slid; remaining 2 went through
  })

  it('notifyNetworkUp resets sanity', async () => {
    const c = new ConnectionFloodController({
      flood: [{ count: 100, windowMs: 100 }], // disabled
    })

    for (let i = 0; i < 5; i++) await c.wait()

    c.notifyNetworkUp()

    const start = Date.now()
    await c.wait()
    expect(Date.now() - start).toBe(0)
  })

  it('mtproto errors gate subsequent waits', async () => {
    const c = new ConnectionFloodController({
      sanity: [{ count: 100, windowMs: 100_000 }],
      flood: [{ count: 100, windowMs: 100 }],
      // mtproto error: 1@1s, 4@2s, 8@3s
    })

    // soak the mtproto-error limiter with a burst of 8
    for (let i = 0; i < 8; i++) c.addMtprotoError()

    // next connect attempt is gated by mtproto-error 8@3s
    const log: number[] = []
    void (async () => {
      await c.wait()
      log.push(Date.now())
    })()

    await vi.advanceTimersByTimeAsync(2999)
    expect(log).toHaveLength(0)

    await vi.advanceTimersByTimeAsync(1)
    expect(log).toEqual([3000])
  })

  it('addMtprotoError uses default now arg', () => {
    const c = new ConnectionFloodController()
    // smoke test the optional now=
    expect(() => c.addMtprotoError()).not.toThrow()
  })

  it('aborts pending wait, clearing the timer', async () => {
    const c = new ConnectionFloodController({
      sanity: DEFAULT_SANITY_LIMITS,
      flood: [{ count: 1, windowMs: 5000 }],
    })

    await c.wait()

    const ac = new AbortController()
    const pending = c.wait(ac.signal)
    await vi.advanceTimersByTimeAsync(100)
    ac.abort(new Error('cancelled'))

    await expect(pending).rejects.toThrow('cancelled')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('rejects immediately if signal is already aborted', async () => {
    const c = new ConnectionFloodController()
    await c.wait()

    const ac = new AbortController()
    ac.abort(new Error('pre'))

    await expect(c.wait(ac.signal)).rejects.toThrow('pre')
  })

  it('does not leak timers on normal resolution', async () => {
    const c = new ConnectionFloodController({
      sanity: DEFAULT_SANITY_LIMITS,
      flood: [{ count: 1, windowMs: 500 }],
    })

    await c.wait()

    const ac = new AbortController()
    const pending = c.wait(ac.signal)

    await vi.advanceTimersByTimeAsync(500)
    await pending

    ac.abort()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('serializes concurrent waiters fairly', async () => {
    const c = new ConnectionFloodController({
      sanity: DEFAULT_SANITY_LIMITS,
      flood: [{ count: 2, windowMs: 1000 }],
    })

    const log: number[] = []
    for (let i = 0; i < 5; i++) {
      void (async () => {
        await c.wait()
        log.push(Date.now())
      })()
    }

    await vi.advanceTimersByTimeAsync(0)
    expect(log).toEqual([0, 0])

    await vi.advanceTimersByTimeAsync(1000)
    expect(log).toEqual([0, 0, 1000, 1000])

    await vi.advanceTimersByTimeAsync(1000)
    expect(log).toEqual([0, 0, 1000, 1000, 2000])
  })

  it('reset clears every limiter', async () => {
    const c = new ConnectionFloodController({
      sanity: [{ count: 100, windowMs: 100_000 }],
      flood: [{ count: 100, windowMs: 100_000 }],
    })
    for (let i = 0; i < 5; i++) await c.wait()
    // soak mtproto-error limiter to saturation
    for (let i = 0; i < 8; i++) c.addMtprotoError()

    c.reset()

    const start = Date.now()
    await c.wait()
    expect(Date.now() - start).toBe(0)
  })

  it('uses TDLib defaults when no limits supplied', () => {
    const c = new ConnectionFloodController()
    // structural smoke: limits match exported constants
    // @ts-expect-error - reading private rules
    expect(c.sanity._rules).toEqual(DEFAULT_SANITY_LIMITS)
    // @ts-expect-error - reading private rules
    expect(c.flood._rules).toEqual(DEFAULT_FLOOD_LIMITS)
    // @ts-expect-error - reading private rules
    expect(c.mtprotoError._rules).toEqual(DEFAULT_MTPROTO_ERROR_LIMITS)
  })
})
