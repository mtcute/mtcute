import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ConnectionFloodController } from './flood-control.js'
import { MultiSessionConnection } from './multi-session-connection.js'

const pickConnection = MultiSessionConnection._pickConnection

describe('pickConnection', () => {
  it('picks the only connection when pool is size 1', () => {
    expect(pickConnection([0], [false])).toBe(0)
    expect(pickConnection([5], [true])).toBe(0)
  })

  it('picks least-loaded when none are ready', () => {
    // cold start: every connection is still connecting; no ready bias.
    // tie-break: first index wins.
    expect(pickConnection([2, 1, 3, 0], [false, false, false, false])).toBe(3)
    expect(pickConnection([0, 0, 0, 0], [false, false, false, false])).toBe(0)
  })

  it('prefers ready over unready even when ready is more loaded', () => {
    // an RPC should land on a connection that is actually up, not on an
    // empty one that may be stuck reconnecting (e.g. flood-gated).
    expect(pickConnection([0, 0, 5, 0], [false, false, true, false])).toBe(2)
  })

  it('picks least-loaded among ready connections', () => {
    expect(pickConnection([5, 3, 7, 1, 9], [true, false, true, true, false])).toBe(3)
  })

  it('ignores unready connections entirely when at least one is ready', () => {
    // pool of 8, only idx 4 ready. all chunks go to 4.
    for (let trial = 0; trial < 5; trial++) {
      const loads = Array.from({ length: 8 }, () => trial)
      const ready = Array.from({ length: 8 }, (_, i) => i === 4)
      expect(pickConnection(loads, ready)).toBe(4)
    }
  })

  it('tie-breaks among ready connections by first index', () => {
    expect(pickConnection([0, 0, 0, 0], [false, true, true, true])).toBe(1)
  })
})

describe('per-slot flood gating', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
    vi.stubGlobal('performance', { now: () => Date.now() })
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('cold-start: fresh slots connect in parallel', async () => {
    // each pool slot owns its controller (TDLib's per-SessionProxy model),
    // so bringing up an 8-conn pool is not serialized by the 1@1s limit.
    const slots = Array.from({ length: 8 }, () => new ConnectionFloodController())

    const log: number[] = []
    for (const slot of slots) {
      void (async () => {
        await slot.wait()
        log.push(Date.now())
      })()
    }

    await vi.advanceTimersByTimeAsync(0)
    expect(log).toHaveLength(8)
    expect(log.every(t => t === 0)).toBe(true)
  })

  it('a spinning slot is throttled without affecting its siblings', async () => {
    const spinning = new ConnectionFloodController()
    const healthy = new ConnectionFloodController()

    // the spinning slot reconnects in a tight loop — gated at 1@1s
    const log: number[] = []
    for (let i = 0; i < 3; i++) {
      void (async () => {
        await spinning.wait()
        log.push(Date.now())
      })()
    }

    await vi.advanceTimersByTimeAsync(0)
    expect(log).toEqual([0])

    // sibling slot connects immediately despite the spinning one
    const start = Date.now()
    await healthy.wait()
    expect(Date.now() - start).toBe(0)

    await vi.advanceTimersByTimeAsync(1000)
    expect(log).toEqual([0, 1000])
    await vi.advanceTimersByTimeAsync(1000)
    expect(log).toEqual([0, 1000, 2000])
  })
})
