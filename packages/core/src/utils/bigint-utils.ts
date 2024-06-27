import { bufferToReversed } from './buffer-utils.js'
import { ICryptoProvider } from './crypto/abstract.js'

/**
 * Get the minimum number of bits required to represent a number
 */
export function bigIntBitLength(n: bigint) {
    // not the fastest way, but at least not .toString(2) and not too complex
    // taken from: https://stackoverflow.com/a/76616288/22656950

    const i = (n.toString(16).length - 1) * 4

    return i + 32 - Math.clz32(Number(n >> BigInt(i)))
}

/**
 * Convert a big integer to a buffer
 *
 * @param value  Value to convert
 * @param length  Length of the resulting buffer (by default it's the minimum required)
 * @param le  Whether to use little-endian encoding
 */
export function bigIntToBuffer(value: bigint, length = 0, le = false): Uint8Array {
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
        dv.setBigUint64(i, value & 0xffffffffffffffffn, true)
        value >>= 64n
    }

    if (unaligned > 0) {
        for (let i = length - unaligned; i < length; i++) {
            u8[i] = Number(value & 0xffn)
            value >>= 8n
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
export function bufferToBigInt(buffer: Uint8Array, le = false): bigint {
    if (le) buffer = bufferToReversed(buffer)

    const unaligned = buffer.length % 8
    const dv = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength - unaligned)

    let res = 0n

    // it is faster to work with 64-bit words than with bytes directly
    for (let i = 0; i < dv.byteLength; i += 8) {
        res = (res << 64n) | BigInt(dv.getBigUint64(i, false))
    }

    if (unaligned > 0) {
        for (let i = buffer.length - unaligned; i < buffer.length; i++) {
            res = (res << 8n) | BigInt(buffer[i])
        }
    }

    return res
}

/**
 * Generate a cryptographically safe random big integer of the given size (in bytes)
 * @param size  Size in bytes
 */
export function randomBigInt(crypto: ICryptoProvider, size: number): bigint {
    return bufferToBigInt(crypto.randomBytes(size))
}

/**
 * Generate a random big integer of the given size (in bits)
 * @param bits
 */
export function randomBigIntBits(crypto: ICryptoProvider, bits: number): bigint {
    let num = randomBigInt(crypto, Math.ceil(bits / 8))

    const bitLength = bigIntBitLength(num)

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

    const byteSize = Math.ceil(bigIntBitLength(interval) / 8)

    let result = randomBigInt(crypto, byteSize)
    while (result > interval) result -= interval

    return min + result
}

/**
 * Compute the multiplicity of 2 in the prime factorization of n
 * @param n
 */
export function twoMultiplicity(n: bigint): bigint {
    if (n === 0n) return 0n

    let m = 0n
    let pow = 1n

    while (true) {
        if ((n & pow) !== 0n) return m
        m += 1n
        pow <<= 1n
    }
}

export function bigIntMin(a: bigint, b: bigint): bigint {
    return a < b ? a : b
}

export function bigIntAbs(a: bigint): bigint {
    return a < 0n ? -a : a
}

export function bigIntGcd(a: bigint, b: bigint): bigint {
    // using euclidean algorithm is fast enough on smaller numbers
    // https://en.wikipedia.org/wiki/Euclidean_algorithm#Implementations

    while (b !== 0n) {
        const t = b
        b = a % b
        a = t
    }

    return a
}

export function bigIntModPow(base: bigint, exp: bigint, mod: bigint): bigint {
    // using the binary method is good enough for our use case
    // https://en.wikipedia.org/wiki/Modular_exponentiation#Right-to-left_binary_method

    base %= mod

    let result = 1n

    while (exp > 0n) {
        if (exp % 2n === 1n) {
            result = (result * base) % mod
        }

        exp >>= 1n
        base = base ** 2n % mod
    }

    return result
}

// below code is based on https://github.com/juanelas/bigint-mod-arith, MIT license

function eGcd(a: bigint, b: bigint): [bigint, bigint, bigint] {
    let x = 0n
    let y = 1n
    let u = 1n
    let v = 0n

    while (a !== 0n) {
        const q = b / a
        const r: bigint = b % a
        const m = x - u * q
        const n = y - v * q
        b = a
        a = r
        x = u
        y = v
        u = m
        v = n
    }

    return [b, x, y]
}

function toZn(a: number | bigint, n: number | bigint): bigint {
    if (typeof a === 'number') a = BigInt(a)
    if (typeof n === 'number') n = BigInt(n)

    if (n <= 0n) {
        throw new RangeError('n must be > 0')
    }

    const aZn = a % n

    return aZn < 0n ? aZn + n : aZn
}

export function bigIntModInv(a: bigint, n: bigint): bigint {
    const [g, x] = eGcd(toZn(a, n), n)

    if (g !== 1n) {
        throw new RangeError(`${a.toString()} does not have inverse modulo ${n.toString()}`) // modular inverse does not exist
    } else {
        return toZn(x, n)
    }
}
