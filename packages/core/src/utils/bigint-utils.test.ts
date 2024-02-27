import { describe, expect, it } from 'vitest'

import { defaultTestCryptoProvider } from '@mtcute/test'

import { getPlatform } from '../platform.js'
import {
    bigIntBitLength,
    bigIntGcd,
    bigIntModInv,
    bigIntModPow,
    bigIntToBuffer,
    bufferToBigInt,
    randomBigInt,
    randomBigIntBits,
    randomBigIntInRange,
    twoMultiplicity,
} from './index.js'

const p = getPlatform()

describe('bigIntBitLength', () => {
    it('should correctly calculate bit length', () => {
        expect(bigIntBitLength(0n)).eq(0)
        expect(bigIntBitLength(1n)).eq(1)
        expect(bigIntBitLength(2n)).eq(2)
        expect(bigIntBitLength(255n)).eq(8)
        expect(bigIntBitLength(256n)).eq(9)
    })
})

describe('bigIntToBuffer', () => {
    it('should handle writing to BE', () => {
        expect([...bigIntToBuffer(BigInt('10495708'), 0, false)]).eql([0xa0, 0x26, 0xdc])
        expect([...bigIntToBuffer(BigInt('10495708'), 4, false)]).eql([0x00, 0xa0, 0x26, 0xdc])
        expect([...bigIntToBuffer(BigInt('10495708'), 8, false)]).eql([0x00, 0x00, 0x00, 0x00, 0x00, 0xa0, 0x26, 0xdc])
        expect([...bigIntToBuffer(BigInt('3038102549'), 4, false)]).eql([0xb5, 0x15, 0xc4, 0x15])
        expect([...bigIntToBuffer(BigInt('9341376580368336208'), 8, false)]).eql([
            ...p.hexDecode('81A33C81D2020550'),
        ])
    })

    it('should handle writing to LE', () => {
        expect([...bigIntToBuffer(BigInt('10495708'), 0, true)]).eql([0xdc, 0x26, 0xa0])
        expect([...bigIntToBuffer(BigInt('10495708'), 4, true)]).eql([0xdc, 0x26, 0xa0, 0x00])
        expect([...bigIntToBuffer(BigInt('10495708'), 8, true)]).eql([0xdc, 0x26, 0xa0, 0x00, 0x00, 0x00, 0x00, 0x00])
        expect([...bigIntToBuffer(BigInt('3038102549'), 4, true)]).eql([0x15, 0xc4, 0x15, 0xb5])
        expect([...bigIntToBuffer(BigInt('9341376580368336208'), 8, true)]).eql([
            ...p.hexDecode('81A33C81D2020550').reverse(),
        ])
    })

    it('should handle large integers', () => {
        const buf = p.hexDecode(
            '1a981ce8bf86bf4a1bd79c2ef829914172f8d0e54cb7ad807552d56977e1c946872e2c7bd77052be30e7e9a7a35c4feff848a25759f5f2f5b0e96538',
        )
        const num = BigInt(
            '0x1a981ce8bf86bf4a1bd79c2ef829914172f8d0e54cb7ad807552d56977e1c946872e2c7bd77052be30e7e9a7a35c4feff848a25759f5f2f5b0e96538',
        )

        expect([...bigIntToBuffer(num, 0, false)]).eql([...buf])
        expect([...bigIntToBuffer(num, 0, true)]).eql([...buf.reverse()])
    })
})

describe('bufferToBigInt', () => {
    it('should handle reading BE', () => {
        expect(bufferToBigInt(new Uint8Array([0xa0, 0x26, 0xdc]), false).toString()).eq('10495708')
        expect(bufferToBigInt(new Uint8Array([0x00, 0xa0, 0x26, 0xdc]), false).toString()).eq('10495708')
        expect(bufferToBigInt(new Uint8Array([0xb5, 0x15, 0xc4, 0x15]), false).toString()).eq('3038102549')
    })

    it('should handle reading LE', () => {
        expect(bufferToBigInt(new Uint8Array([0xdc, 0x26, 0xa0]), true).toString()).eq('10495708')
        expect(bufferToBigInt(new Uint8Array([0xdc, 0x26, 0xa0, 0x00]), true).toString()).eq('10495708')
        expect(bufferToBigInt(new Uint8Array([0x15, 0xc4, 0x15, 0xb5]), true).toString()).eq('3038102549')
    })

    it('should handle large integers', () => {
        const buf = p.hexDecode(
            '1a981ce8bf86bf4a1bd79c2ef829914172f8d0e54cb7ad807552d56977e1c946872e2c7bd77052be30e7e9a7a35c4feff848a25759f5f2f5b0e96538',
        )
        const num = BigInt(
            '0x1a981ce8bf86bf4a1bd79c2ef829914172f8d0e54cb7ad807552d56977e1c946872e2c7bd77052be30e7e9a7a35c4feff848a25759f5f2f5b0e96538',
        )

        expect(bufferToBigInt(buf, false).toString()).eq(num.toString())
        expect(bufferToBigInt(buf.reverse(), true).toString()).eq(num.toString())
    })
})

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

        expect(bigIntBitLength(a)).toBeLessThanOrEqual(32 * 8)
        expect(bigIntBitLength(b)).toBeLessThanOrEqual(64 * 8)
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

        expect(bigIntBitLength(a)).toBeLessThanOrEqual(32)
        expect(bigIntBitLength(b)).toBeLessThanOrEqual(64)
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

describe('twoMultiplicity', () => {
    it('should return the multiplicity of 2 in the prime factorization of n', () => {
        expect(twoMultiplicity(0n)).toEqual(0n)
        expect(twoMultiplicity(1n)).toEqual(0n)
        expect(twoMultiplicity(2n)).toEqual(1n)
        expect(twoMultiplicity(4n)).toEqual(2n)
        expect(twoMultiplicity(65536n)).toEqual(16n)
        expect(twoMultiplicity(65537n)).toEqual(0n)
    })
})

describe('bigIntGcd', () => {
    it('should return the greatest common divisor of a and b', () => {
        expect(bigIntGcd(123n, 456n)).toEqual(3n)
    })

    it('should correctly handle zeros', () => {
        expect(bigIntGcd(0n, 0n)).toEqual(0n)
        expect(bigIntGcd(0n, 1n)).toEqual(1n)
        expect(bigIntGcd(1n, 0n)).toEqual(1n)
    })

    it('should correctly handle equal values', () => {
        expect(bigIntGcd(1n, 1n)).toEqual(1n)
    })
})

describe('bigIntModPow', () => {
    it('should correctly calculate modular exponentiation', () => {
        expect(bigIntModPow(2n, 3n, 5n)).toEqual(3n)
        expect(bigIntModPow(2n, 3n, 6n)).toEqual(2n)
        expect(bigIntModPow(2n, 3n, 7n)).toEqual(1n)
        expect(bigIntModPow(2n, 3n, 8n)).toEqual(0n)
    })

    it('should correctly handle very large numbers', () => {
        // calculating this with BigInt would either take forever or error with "Maximum BigInt size exceeded
        expect(bigIntModPow(2n, 100000000000n, 100n)).toEqual(76n)
    })
})

describe('bigIntModInv', () => {
    it('should correctly calculate modular inverse', () => {
        expect(bigIntModInv(2n, 5n)).toEqual(3n)
        expect(bigIntModInv(2n, 7n)).toEqual(4n)
    })

    it("should error if there's no modular inverse", () => {
        expect(() => bigIntModInv(2n, 6n)).toThrow(RangeError)
        expect(() => bigIntModInv(2n, 8n)).toThrow(RangeError)
    })

    it('should correctly handle very large numbers', () => {
        // calculating this with BigInt would either take forever or error with "Maximum BigInt size exceeded
        expect(bigIntModInv(123123123123n, 1829n)).toEqual(318n)
    })
})
