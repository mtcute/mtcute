import { describe, expect, it } from 'vitest'
import { defaultTestCryptoProvider } from '@mtcute/test'
import { bigint } from '@fuman/utils'

import {
    randomBigInt,
    randomBigIntBits,
    randomBigIntInRange,
} from './index.js'

describe('randomBigInt', async () => {
    const c = await defaultTestCryptoProvider()

    it('should return a random bigint', () => {
        const a = randomBigInt(c, 32)
        const b = randomBigInt(c, 32)

        expect(a).not.toEqual(b)
    })

    it('should return a random bigint up to specified byte length', () => {
        const a = randomBigInt(c, 32)
        const b = randomBigInt(c, 64)

        expect(bigint.bitLength(a)).toBeLessThanOrEqual(32 * 8)
        expect(bigint.bitLength(b)).toBeLessThanOrEqual(64 * 8)
    })
})

describe('randomBigIntBits', async () => {
    const c = await defaultTestCryptoProvider()

    it('should return a random bigint', () => {
        const a = randomBigIntBits(c, 32)
        const b = randomBigIntBits(c, 32)

        expect(a).not.toEqual(b)
    })

    it('should return a random bigint up to specified bit length', () => {
        const a = randomBigIntBits(c, 32)
        const b = randomBigIntBits(c, 64)

        expect(bigint.bitLength(a)).toBeLessThanOrEqual(32)
        expect(bigint.bitLength(b)).toBeLessThanOrEqual(64)
    })
})

describe('randomBigIntInRange', async () => {
    const c = await defaultTestCryptoProvider()

    it('should return a random bigint', () => {
        const a = randomBigIntInRange(c, 10000n)
        const b = randomBigIntInRange(c, 10000n)

        expect(a).not.toEqual(b)
    })

    it('should return a bigint within a given range', () => {
        const a = randomBigIntInRange(c, 200n, 100n)

        expect(a).toBeGreaterThanOrEqual(100n)
        expect(a).toBeLessThan(200n)
    })
})
