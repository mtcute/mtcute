import { describe, expect, it } from 'vitest'

import { createControllablePromise } from './controllable-promise.js'

describe('createControllablePromise', () => {
    it('should resolve', async () => {
        const p = createControllablePromise()
        p.resolve(1)
        await expect(p).resolves.toBe(1)
    })

    it('should reject', async () => {
        const p = createControllablePromise()
        p.reject(1)
        await expect(p).rejects.toBe(1)
    })
})
