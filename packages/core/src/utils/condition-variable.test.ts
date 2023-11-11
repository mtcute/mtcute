import { describe, expect, it } from 'vitest'

import { ConditionVariable } from './condition-variable.js'

describe('ConditionVariable', () => {
    it('should correctly unlock execution', async () => {
        const cv = new ConditionVariable()

        setTimeout(() => cv.notify(), 10)

        await cv.wait()

        expect(true).toBeTruthy()
    })

    it('should correctly time out', async () => {
        const cv = new ConditionVariable()

        await cv.wait(10)

        expect(true).toBeTruthy()
    })

    it('should only unlock once', async () => {
        const cv = new ConditionVariable()

        setTimeout(() => {
            cv.notify()
            cv.notify()
        }, 10)

        await cv.wait()

        expect(true).toBeTruthy()
    })
})
