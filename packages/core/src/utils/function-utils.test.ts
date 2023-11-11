import { describe, expect, it } from 'vitest'

import { ConditionVariable } from './condition-variable.js'
import { throttle } from './function-utils.js'

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
