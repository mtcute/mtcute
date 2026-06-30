import { timers } from '@fuman/utils'
import { describe, expect, it } from 'vitest'

import { ResourceLimiter } from './resource-limiter.js'

function track(p: Promise<void>) {
  const state = { done: false, rejected: false, error: undefined as unknown }
  p.then(
    () => {
      state.done = true
    },
    (e) => {
      state.done = true
      state.rejected = true
      state.error = e
    },
  )
  return state
}

function flush() {
  return new Promise<void>((resolve) => {
    timers.setTimeout(resolve, 0)
  })
}

describe('ResourceLimiter', () => {
  it('grants immediately when budget is available', async () => {
    const l = new ResourceLimiter(1000)
    const a = track(l.acquire(600))
    await flush()
    expect(a.done).toBe(true)
  })

  it('queues when budget is exhausted and grants in FIFO order', async () => {
    const l = new ResourceLimiter(1000)
    await l.acquire(700)
    const a = track(l.acquire(600))
    const b = track(l.acquire(100))
    await flush()
    expect(a.done).toBe(false)
    expect(b.done).toBe(false)

    l.release(700)
    await flush()
    expect(a.done).toBe(true)
    expect(b.done).toBe(true)
  })

  it('keeps a fitting request blocked behind a larger queued one', async () => {
    const l = new ResourceLimiter(1000)
    await l.acquire(800)
    const a = track(l.acquire(500))
    const b = track(l.acquire(100))
    await flush()
    expect(a.done).toBe(false)
    expect(b.done).toBe(false)

    l.release(800)
    await flush()
    expect(a.done).toBe(true)
    expect(b.done).toBe(true)
  })

  it('wakes waiters when the budget is increased', async () => {
    const l = new ResourceLimiter(1000)
    await l.acquire(800)
    const a = track(l.acquire(500))
    await flush()
    expect(a.done).toBe(false)

    l.setMax(2000)
    await flush()
    expect(a.done).toBe(true)
  })

  it('reduces available budget when shrunk', async () => {
    const l = new ResourceLimiter(1000)
    await l.acquire(100)
    l.setMax(500)
    const a = track(l.acquire(500))
    await flush()
    expect(a.done).toBe(false)

    l.release(100)
    await flush()
    expect(a.done).toBe(true)
  })

  it('removes an aborted waiter without consuming budget', async () => {
    const l = new ResourceLimiter(100)
    await l.acquire(100)
    const ctl = new AbortController()
    const a = track(l.acquire(50, ctl.signal))
    const b = track(l.acquire(50))
    await flush()
    expect(a.done).toBe(false)

    ctl.abort()
    await flush()
    expect(a.rejected).toBe(true)
    expect(b.done).toBe(false)

    l.release(100)
    await flush()
    expect(b.done).toBe(true)
  })

  it('does not reject when aborted after an immediate grant', async () => {
    const l = new ResourceLimiter(100)
    const ctl = new AbortController()
    const a = track(l.acquire(50, ctl.signal))
    await flush()
    expect(a.done).toBe(true)
    expect(a.rejected).toBe(false)

    ctl.abort()
    await flush()
    expect(a.rejected).toBe(false)
  })

  it('does not reject when aborted after a queued waiter is granted', async () => {
    const l = new ResourceLimiter(100)
    await l.acquire(100)
    const ctl = new AbortController()
    const a = track(l.acquire(50, ctl.signal))
    l.release(100)
    await flush()
    expect(a.done).toBe(true)

    ctl.abort()
    await flush()
    expect(a.rejected).toBe(false)
  })

  it('clamps a request larger than the maximum budget', async () => {
    const l = new ResourceLimiter(100)
    const a = track(l.acquire(500))
    await flush()
    expect(a.done).toBe(true)

    const b = track(l.acquire(100))
    await flush()
    expect(b.done).toBe(false)

    l.release(500)
    await flush()
    expect(b.done).toBe(true)
  })

  it('tryAcquire grabs the budget synchronously when available', () => {
    const l = new ResourceLimiter(1000)
    expect(l.tryAcquire(600)).toBe(true)
    expect(l.tryAcquire(600)).toBe(false)
    expect(l.tryAcquire(400)).toBe(true)
  })

  it('tryAcquire fails when a waiter is already queued', async () => {
    const l = new ResourceLimiter(1000)
    await l.acquire(800)
    track(l.acquire(500))
    expect(l.tryAcquire(100)).toBe(false)
  })
})
