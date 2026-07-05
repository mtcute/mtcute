import { describe, expect, it } from 'vitest'

import { combineAbortSignals } from './abort-signal.js'

describe('combineAbortSignals', () => {
  it('should return the first signal as-is when the second is missing', () => {
    const signal = new AbortController().signal
    expect(combineAbortSignals(signal)).toBe(signal)
  })

  it('should abort when the first signal aborts', () => {
    const c1 = new AbortController()
    const c2 = new AbortController()
    const combined = combineAbortSignals(c1.signal, c2.signal)

    c1.abort(new Error('boom'))

    expect(combined.aborted).toBe(true)
    expect(combined.reason).toEqual(new Error('boom'))
  })

  it('should abort when the second signal aborts', () => {
    const c1 = new AbortController()
    const c2 = new AbortController()
    const combined = combineAbortSignals(c1.signal, c2.signal)

    c2.abort(new Error('boom'))

    expect(combined.aborted).toBe(true)
    expect(combined.reason).toEqual(new Error('boom'))
  })

  it('should not attach listeners to the source signals', () => {
    const c1 = new AbortController()
    const c2 = new AbortController()

    let added = 0
    c1.signal.addEventListener = () => {
      added++
    }

    combineAbortSignals(c1.signal, c2.signal)

    expect(added).toBe(0)
  })
})
