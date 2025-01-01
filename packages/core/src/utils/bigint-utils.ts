/* eslint-disable style/max-len */
import type { ICryptoProvider } from './crypto/abstract.js'

import { BigInteger } from '@modern-dev/jsbn'

/**
 * a < b
 * @param a
 * @param b
 * @returns
 */
export function lt(a: BigInteger, b: BigInteger): boolean {
    return a.compareTo(b) < 0
}

/**
 * a > b
 * @param a
 * @param b
 * @returns
 */
export function gt(a: BigInteger, b: BigInteger): boolean {
    return a.compareTo(b) > 0
}

/**
 * a <= b
 * @param a
 * @param b
 * @returns
 */
export function leq(a: BigInteger, b: BigInteger): boolean {
    return a.compareTo(b) <= 0
}

/**
 * a >= b
 * @param a
 * @param b
 * @returns
 */
export function geq(a: BigInteger, b: BigInteger): boolean {
    return a.compareTo(b) >= 0
}

/**
 * Helper function to quickly create a BigInteger from an int
 * @param n
 */
export function fromInt(n: number): BigInteger {
    const bi = new BigInteger(null)
    bi.fromInt(n)
    return bi
}

/**
 * Helper function to quickly create a BigInteger from a radix string
 * @param n
 * @param radix
 */
export function fromRadix(n: string, radix: number): BigInteger {
    const bi = new BigInteger(null)
    bi.fromRadix(n, radix)
    return bi
}

export function bitLength(n: BigInteger): number {
    return n.bitLength()
}

/**
 * polyfill for DataView.getBigUint64
 * @param dataView
 * @param byteOffset
 * @param littleEndian
 * @returns
 */
export function getBigUint64(
    dataView: DataView,
    byteOffset: number,
    littleEndian: boolean | undefined,
): BigInteger {
    const a = dataView.getUint32(byteOffset, littleEndian)

    const b = dataView.getUint32(byteOffset + 4, littleEndian)

    const littleEndianMask = Number(!!littleEndian)

    const bigEndianMask = Number(!littleEndian)

    // This branch-less optimization is 77x faster than normal ternary operator.

    // and only 3% slower than native implementation

    // https://jsbench.me/p8kyhg1eqv/1

    return (fromInt(a * bigEndianMask + b * littleEndianMask).shiftLeft(32)).or(fromInt(a * littleEndianMask + b * bigEndianMask))
}

/**
 * Compute the multiplicity of 2 in the prime factorization of n
 * @param n
 */
export function twoMultiplicity(n: BigInteger): BigInteger {
    if (n.equals(BigInteger.ZERO)) return fromInt(0)

    // we don't use the static values because we want to mutate it
    const m = fromInt(0)
    const pow = fromInt(1)

    while (true) {
        if (!n.and(pow).equals(BigInteger.ZERO)) return m
        // m = m + ONE
        m.addTo(BigInteger.ONE, m)
        // pow = pow << 1
        pow.lShiftTo(1, pow)
    }
}

/**
 * Reverse a buffer (or a part of it) into a new buffer
 */
export function bufferToReversed(buf: Uint8Array, start = 0, end: number = buf.length): Uint8Array {
    const len = end - start
    const ret = new Uint8Array(len)

    for (let i = 0; i < len; i++) {
        ret[i] = buf[end - i - 1]
    }

    return ret
}

export function fromBytes(buffer: Uint8Array, le = false): BigInteger {
    if (le) buffer = bufferToReversed(buffer)

    const unaligned = buffer.length % 8
    const dv = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength - unaligned)

    let res = fromInt(0)

    // it is faster to work with 64-bit words than with bytes directly
    for (let i = 0; i < dv.byteLength; i += 8) {
        res = (res.shiftLeft(64)).or(getBigUint64(dv, i, false))
    }

    if (unaligned > 0) {
        for (let i = buffer.length - unaligned; i < buffer.length; i++) {
            res = ((res.shiftLeft(8)).or(fromInt(buffer[i])))
        }
    }

    return res
}

/**
 * Convert a big integer to a buffer
 *
 * @param value  Value to convert
 * @param length  Length of the resulting buffer (by default it's computed automatically)
 * @param le  Whether to use little-endian encoding
 */
export function toBytes(value: BigInteger, length = 0, le = false): Uint8Array {
    const array = value.toByteArray(false)

    if (length !== 0 && array.length > length) {
        throw new Error('Value out of bounds')
    }

    if (length !== 0) {
        // padding
        while (array.length !== length) array.unshift(0)
    }

    if (le) array.reverse()

    const buffer = new Uint8Array(length || array.length)
    buffer.set(array, 0)

    return buffer
}

/**
 * Generate a cryptographically safe random big integer of the given size (in bytes)
 * @param size  Size in bytes
 */
export function randomBigInt(crypto: ICryptoProvider, size: number): BigInteger {
    return fromBytes(crypto.randomBytes(size))
}

/**
 * Generate a random big integer of the given size (in bits)
 * @param bits
 */
export function randomBigIntBits(crypto: ICryptoProvider, bits: number): BigInteger {
    const num = randomBigInt(crypto, Math.ceil(bits / 8))

    const _bitLength = bitLength(num)

    if (_bitLength > bits) {
        const toTrim = _bitLength - bits
        // num >>= BigInt(toTrim)
        // r = r >> n
        num.rShiftTo(toTrim, num)
    }

    return num
}

/**
 * Generate a random big integer in the range [min, max)
 *
 * @param max  Maximum value (exclusive)
 * @param min  Minimum value (inclusive)
 */
export function randomBigIntInRange(crypto: ICryptoProvider, max: BigInteger, min: BigInteger = fromInt(0)): BigInteger {
    const interval = max.subtract(min)
    // if (interval < 0n) throw new Error('expected min < max')
    if (interval.compareTo(BigInteger.ZERO) < 0) throw new Error('expected min < max')

    const byteSize = Math.ceil(bitLength(interval) / 8)

    const result = randomBigInt(crypto, byteSize)
    while (result.compareTo(interval) > 0) {
        // r = r - a
        result.subTo(interval, result)
    }

    return min.add(result)
}

export function min2(a: BigInteger, b: BigInteger): BigInteger {
    return a.min(b)
}

export function max2(a: BigInteger, b: BigInteger): BigInteger {
    return a.max(b)
}

export function abs(a: BigInteger): BigInteger {
    return a.abs()
}
