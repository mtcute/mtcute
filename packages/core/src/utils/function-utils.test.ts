import { ConditionVariable } from '@fuman/utils'
import { describe, expect, it } from 'vitest'

import { asyncResettable, throttle } from './function-utils.js'

describe('asyncResettable', () => {
  it('should allow retrying after a failed invocation', async () => {
    const firstError = new Error('first invocation failed')
    let invocations = 0
    const resettable = asyncResettable(async () => {
      invocations++
      if (invocations === 1) throw firstError
    })

    await expect(resettable.run()).rejects.toBe(firstError)
    expect(resettable.wait()).toBeNull()

    await expect(resettable.run()).resolves.toBeUndefined()
    expect(invocations).toBe(2)
    expect(resettable.finished()).toBe(true)
  })
})

describe('throttle', () => {
  it('should throttle', async () => {
    const cv = new ConditionVariable()
    let count = 0

    const func = () => {
      count++
      cv.notify()
    }

    const throttled = throttle(func, 10)

    throttled()
    throttled()
    throttled()
    throttled()

    await cv.wait()

    expect(count).eq(1)
  })
})
