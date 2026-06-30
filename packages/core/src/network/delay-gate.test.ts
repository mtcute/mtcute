import { afterEach, describe, expect, it, vi } from 'vitest'

import { DownloadDelayGate } from './delay-gate.js'

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

describe('DownloadDelayGate', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not delay the first dispatch', async () => {
    vi.useFakeTimers()
    const gate = new DownloadDelayGate()
    const w = track(gate.wait())
    await Promise.resolve()
    await Promise.resolve()
    expect(w.done).toBe(true)
  })

  it('spaces subsequent dispatches with a decaying delay', async () => {
    vi.useFakeTimers()
    const gate = new DownloadDelayGate()
    await gate.wait()

    const w2 = track(gate.wait())
    await vi.advanceTimersByTimeAsync(49)
    expect(w2.done).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    expect(w2.done).toBe(true)

    const w3 = track(gate.wait())
    await vi.advanceTimersByTimeAsync(39)
    expect(w3.done).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    expect(w3.done).toBe(true)
  })

  it('decays the delay toward the 3ms floor', () => {
    vi.useFakeTimers()
    const gate = new DownloadDelayGate()
    for (let i = 0; i < 15; i++) void gate.wait()
    // @ts-expect-error reading private
    expect(gate._delay).toBe(3)
  })

  it('rejects a pending delay when aborted', async () => {
    vi.useFakeTimers()
    const gate = new DownloadDelayGate()
    await gate.wait()

    const ctl = new AbortController()
    const w = track(gate.wait(ctl.signal))
    await vi.advanceTimersByTimeAsync(10)
    expect(w.done).toBe(false)

    ctl.abort()
    await Promise.resolve()
    await Promise.resolve()
    expect(w.rejected).toBe(true)
  })
})
