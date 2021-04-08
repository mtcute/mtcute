import bigInt, { BigInteger } from 'big-integer'
import { randomBytes } from './buffer-utils'

export const bigIntTwo = bigInt(2)
export const LONG_OVERFLOW = bigInt('8000000000000000', 16)
export const LONG_SIGN_DELTA = bigInt('10000000000000000', 16)

export function ulongToLong(val: BigInteger): BigInteger {
    if (val.gt(LONG_OVERFLOW)) return val.minus(LONG_SIGN_DELTA)
    return val
}

export function longToUlong(val: BigInteger): BigInteger {
    if (val.isNegative()) return val.plus(LONG_SIGN_DELTA)
    return val
}

export function writeBigInt(
    buffer: Buffer,
    value: BigInteger,
    length = 0,
    offset = 0,
    le = false
): void {
    const array = value.toArray(256).value
    if (length !== 0 && array.length > length)
        throw new Error('Value out of bounds')

    if (length !== 0) {
        // padding
        while (array.length !== length) array.unshift(0)
    }

    if (le) array.reverse()

    buffer.set(array, offset)
}

export function bigIntToBuffer(
    value: BigInteger,
    length = 0,
    le = false
): Buffer {
    const array = value.toArray(256).value
    if (length !== 0 && array.length > length)
        throw new Error('Value out of bounds')

    if (length !== 0) {
        // padding
        while (array.length !== length) array.unshift(0)
    }

    if (le) array.reverse()

    const buffer = Buffer.alloc(length || array.length)
    buffer.set(array, 0)
    return buffer
}

export function bufferToBigInt(
    buffer: Buffer,
    offset = 0,
    length = buffer.length,
    le = false
): BigInteger {
    const arr = [...buffer.slice(offset, offset + length)]

    if (le) arr.reverse()

    return bigInt.fromArray(arr, 256)
}

export function randomBigInt(size: number): BigInteger {
    return bufferToBigInt(randomBytes(size))
}
