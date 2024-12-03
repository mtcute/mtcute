import type { ICryptoProvider } from './crypto/abstract.js'

import { bigint } from '@fuman/utils'

/**
 * Generate a cryptographically safe random big integer of the given size (in bytes)
 * @param size  Size in bytes
 */
export function randomBigInt(crypto: ICryptoProvider, size: number): bigint {
    return bigint.fromBytes(crypto.randomBytes(size))
}

/**
 * Generate a random big integer of the given size (in bits)
 * @param bits
 */
export function randomBigIntBits(crypto: ICryptoProvider, bits: number): bigint {
    let num = randomBigInt(crypto, Math.ceil(bits / 8))

    const bitLength = bigint.bitLength(num)

    if (bitLength > bits) {
        const toTrim = bitLength - bits
        num >>= BigInt(toTrim)
    }

    return num
}

/**
 * Generate a random big integer in the range [min, max)
 *
 * @param max  Maximum value (exclusive)
 * @param min  Minimum value (inclusive)
 */
export function randomBigIntInRange(crypto: ICryptoProvider, max: bigint, min = 1n): bigint {
    const interval = max - min
    if (interval < 0n) throw new Error('expected min < max')

    const byteSize = Math.ceil(bigint.bitLength(interval) / 8)

    let result = randomBigInt(crypto, byteSize)
    while (result > interval) result -= interval

    return min + result
}
