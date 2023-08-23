import bigInt, { BigInteger } from 'big-integer'

import { randomBytes } from './buffer-utils'

/**
 * Convert a big integer to a buffer
 *
 * @param value  Value to convert
 * @param length  Length of the resulting buffer (by default it's computed automatically)
 * @param le  Whether to use little-endian encoding
 */
export function bigIntToBuffer(
    value: BigInteger,
    length = 0,
    le = false,
): Buffer {
    const array = value.toArray(256).value

    if (length !== 0 && array.length > length) {
        throw new Error('Value out of bounds')
    }

    if (length !== 0) {
        // padding
        while (array.length !== length) array.unshift(0)
    }

    if (le) array.reverse()

    const buffer = Buffer.alloc(length || array.length)
    buffer.set(array, 0)

    return buffer
}

/**
 * Convert a buffer to a big integer
 *
 * @param buffer  Buffer to convert
 * @param offset  Offset to start reading from
 * @param length  Length to read
 * @param le  Whether to use little-endian encoding
 */
export function bufferToBigInt(
    buffer: Buffer,
    offset = 0,
    length = buffer.length,
    le = false,
): BigInteger {
    const arr = [...buffer.slice(offset, offset + length)]

    if (le) arr.reverse()

    return bigInt.fromArray(arr, 256)
}

/**
 * Generate a random big integer of the given size (in bytes)
 * @param size  Size in bytes
 */
export function randomBigInt(size: number): BigInteger {
    return bufferToBigInt(randomBytes(size))
}

/**
 * Generate a random big integer of the given size (in bits)
 * @param bits
 */
export function randomBigIntBits(bits: number): BigInteger {
    let num = randomBigInt(Math.ceil(bits / 8))

    const bitLength = num.bitLength()

    if (bitLength.gt(bits)) {
        const toTrim = bigInt.randBetween(bitLength.minus(bits), 8)
        num = num.shiftRight(toTrim)
    }

    return num
}

/**
 * Generate a random big integer in the range [min, max)
 *
 * @param max  Maximum value (exclusive)
 * @param min  Minimum value (inclusive)
 */
export function randomBigIntInRange(
    max: BigInteger,
    min = bigInt.one,
): BigInteger {
    const interval = max.minus(min)
    if (interval.isNegative()) throw new Error('expected min < max')

    const byteSize = interval.bitLength().divide(8).toJSNumber()

    let result = randomBigInt(byteSize)
    while (result.gt(interval)) result = result.minus(interval)

    return min.plus(result)
}

/**
 * Compute the multiplicity of 2 in the prime factorization of n
 * @param n
 */
export function twoMultiplicity(n: BigInteger): BigInteger {
    if (n === bigInt.zero) return bigInt.zero

    let m = bigInt.zero
    let pow = bigInt.one

    while (true) {
        if (!n.and(pow).isZero()) return m
        m = m.plus(bigInt.one)
        pow = pow.shiftLeft(1)
    }
}
