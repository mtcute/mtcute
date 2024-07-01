import JSBI from 'jsbi'
import { bufferToReversed } from './buffer-utils.js'
import { ICryptoProvider } from './crypto/abstract.js'

/**
 * Get the minimum number of bits required to represent a number
 */
export function bigIntBitLength(n: JSBI) {
    // not the fastest way, but at least not .toString(2) and not too complex
    // taken from: https://stackoverflow.com/a/76616288/22656950

    const i = (n.toString(16).length - 1) * 4

    return i + 32 - Math.clz32(JSBI.toNumber(JSBI.signedRightShift(n, JSBI.BigInt(i))))
}

/**
 * Convert a big integer to a buffer
 *
 * @param value  Value to convert
 * @param length  Length of the resulting buffer (by default it's the minimum required)
 * @param le  Whether to use little-endian encoding
 */
export function bigIntToBuffer(value: JSBI, length = 0, le = false): Uint8Array {
    const bits = bigIntBitLength(value)
    const bytes = Math.ceil(bits / 8)

    if (length !== 0 && bytes > length) {
        throw new Error('Value out of bounds')
    }

    if (length === 0) length = bytes

    const buf = new ArrayBuffer(length)
    const u8 = new Uint8Array(buf)

    const unaligned = length % 8
    const dv = new DataView(buf, 0, length - unaligned)

    // it is faster to work with 64-bit words than with bytes directly
    for (let i = 0; i < dv.byteLength; i += 8) {
        JSBI.DataViewSetBigUint64(dv, i, JSBI.bitwiseAnd(value, JSBI.BigInt('0xffffffffffffffff')), true)
        value = JSBI.signedRightShift(value, JSBI.BigInt(64))
    }

    if (unaligned > 0) {
        for (let i = length - unaligned; i < length; i++) {
            u8[i] = JSBI.toNumber(JSBI.bitwiseAnd(value, JSBI.BigInt('0xff')))
            value = JSBI.signedRightShift(value, JSBI.BigInt(8))
        }
    }

    if (!le) u8.reverse()

    return u8
}

/**
 * Convert a buffer to a big integer
 *
 * @param buffer  Buffer to convert
 * @param le  Whether to use little-endian encoding
 */
export function bufferToBigInt(buffer: Uint8Array, le = false): JSBI {
    if (le) buffer = bufferToReversed(buffer)

    const unaligned = buffer.length % 8
    const dv = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength - unaligned)

    let res = JSBI.BigInt(0)

    // it is faster to work with 64-bit words than with bytes directly
    for (let i = 0; i < dv.byteLength; i += 8) {
        res = JSBI.bitwiseOr(JSBI.leftShift(res, JSBI.BigInt(64)), JSBI.DataViewGetBigUint64(dv, i, false))
    }

    if (unaligned > 0) {
        for (let i = buffer.length - unaligned; i < buffer.length; i++) {
            res = JSBI.bitwiseOr(JSBI.leftShift(res, JSBI.BigInt(8)), JSBI.BigInt(buffer[i]))
        }
    }

    return res
}

/**
 * Generate a cryptographically safe random big integer of the given size (in bytes)
 * @param size  Size in bytes
 */
export function randomBigInt(crypto: ICryptoProvider, size: number): JSBI {
    return bufferToBigInt(crypto.randomBytes(size))
}

/**
 * Generate a random big integer of the given size (in bits)
 * @param bits
 */
export function randomBigIntBits(crypto: ICryptoProvider, bits: number): JSBI {
    let num = randomBigInt(crypto, Math.ceil(bits / 8))

    const bitLength = bigIntBitLength(num)

    if (bitLength > bits) {
        const toTrim = bitLength - bits
        num = JSBI.signedRightShift(num, JSBI.BigInt(toTrim))
    }

    return num
}

/**
 * Generate a random big integer in the range [min, max)
 *
 * @param max  Maximum value (exclusive)
 * @param min  Minimum value (inclusive)
 */
export function randomBigIntInRange(crypto: ICryptoProvider, max: JSBI, min = JSBI.BigInt(1)): JSBI {
    const interval = JSBI.subtract(max, min)
    if (JSBI.lessThan(interval, JSBI.BigInt(0))) throw new Error('expected min < max')

    const byteSize = Math.ceil(bigIntBitLength(interval)) / 8

    let result = randomBigInt(crypto, byteSize)
    while (JSBI.greaterThan(result, interval)) result = JSBI.subtract(result, interval)

    return JSBI.add(min, result)
}

/**
 * Compute the multiplicity of 2 in the prime factorization of n
 * @param n
 */
export function twoMultiplicity(n: JSBI): JSBI {
    if (JSBI.equal(n, JSBI.BigInt(0))) return JSBI.BigInt(0)

    let m = JSBI.BigInt(0)
    let pow = JSBI.BigInt(1)

    while (true) {
        if (JSBI.notEqual(JSBI.bitwiseAnd(n, pow), JSBI.BigInt(0))) return m
        m = JSBI.add(m, JSBI.BigInt(1))
        pow = JSBI.leftShift(pow, JSBI.BigInt(1))
    }
}

export function bigIntMin(a: JSBI, b: JSBI): JSBI {
    return JSBI.lessThan(a, b) ? a : b
}

export function bigIntAbs(a: JSBI): JSBI {
    return JSBI.lessThan(a, JSBI.BigInt(0)) ? JSBI.unaryMinus(a) : a
}

export function bigIntGcd(a: JSBI, b: JSBI): JSBI {
    // using euclidean algorithm is fast enough on smaller numbers
    // https://en.wikipedia.org/wiki/Euclidean_algorithm#Implementations

    while (JSBI.notEqual(b, JSBI.BigInt(0))) {
        const t = b
        b = JSBI.remainder(a, b)
        a = t
    }

    return a
}

export function bigIntModPow(base: JSBI, exp: JSBI, mod: JSBI): JSBI {
    // using the binary method is good enough for our use case
    // https://en.wikipedia.org/wiki/Modular_exponentiation#Right-to-left_binary_method

    base = JSBI.remainder(base, mod)

    let result = JSBI.BigInt(1)

    while (JSBI.greaterThan(exp, JSBI.BigInt(0))) {
        if (JSBI.equal(JSBI.remainder(exp, JSBI.BigInt(2)), JSBI.BigInt(1))) {
            result = JSBI.remainder(JSBI.multiply(result, base), mod)
        }

        exp = JSBI.signedRightShift(exp, JSBI.BigInt(1))
        base = JSBI.remainder(JSBI.exponentiate(base, JSBI.BigInt(2)), mod)
    }

    return result
}

// below code is based on https://github.com/juanelas/JSBI-mod-arith, MIT license

function eGcd(a: JSBI, b: JSBI): [JSBI, JSBI, JSBI] {
    let x = JSBI.BigInt(0)
    let y = JSBI.BigInt(1)
    let u = JSBI.BigInt(1)
    let v = JSBI.BigInt(0)

    while (JSBI.notEqual(a, JSBI.BigInt(0))) {
        const q = JSBI.divide(b, a)
        const r: JSBI = JSBI.remainder(b, a)
        const m = JSBI.subtract(x, JSBI.multiply(u, q))
        const n = JSBI.subtract(y, JSBI.multiply(v, q))
        b = a
        a = r
        x = u
        y = v
        u = m
        v = n
    }

    return [b, x, y]
}

function toZn(a: number | JSBI, n: number | JSBI): JSBI {
    if (typeof a === 'number') a = JSBI.BigInt(a)
    if (typeof n === 'number') n = JSBI.BigInt(n)

    if (JSBI.lessThanOrEqual(n, JSBI.BigInt(0))) {
        throw new RangeError('n must be > 0')
    }

    const aZn = JSBI.remainder(a, n)

    return JSBI.lessThan(aZn, JSBI.BigInt(0)) ? JSBI.add(aZn, n) : aZn
}

export function bigIntModInv(a: JSBI, n: JSBI): JSBI {
    const [g, x] = eGcd(toZn(a, n), n)

    if (JSBI.notEqual(g, JSBI.BigInt(1))) {
        throw new RangeError(`${a.toString()} does not have inverse modulo ${n.toString()}`) // modular inverse does not exist
    } else {
        return toZn(x, n)
    }
}
