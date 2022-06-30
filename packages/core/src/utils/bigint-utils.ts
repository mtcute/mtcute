import bigInt, { BigInteger } from 'big-integer'

import { randomBytes } from './buffer-utils'

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

export function randomBigIntInRange(
    max: BigInteger,
    min = bigInt.one
): BigInteger {
    const interval = max.minus(min)
    if (interval.isNegative()) throw new Error('expected min < max')

    const byteSize = interval.bitLength().divide(8).toJSNumber()

    let result = randomBigInt(byteSize)
    while (result.gt(interval)) result = result.minus(interval)

    return min.plus(result)
}
