import Long from 'long'
import { describe, expect, it } from 'vitest'

import {
    longFromBuffer,
    longFromFastString,
    LongMap,
    LongSet,
    longToFastString,
    randomLong,
    removeFromLongArray,
} from './long-utils.js'

describe('randomLong', () => {
    it('should return a random Long', () => {
        const long = randomLong()
        const long2 = randomLong()

        expect(long).toBeInstanceOf(Long)
        expect(long.eq(long2)).toBeFalsy()
    })
})

describe('longFromBuffer', () => {
    it('should correctly read LE longs', () => {
        expect(longFromBuffer(new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0]))).toEqual(Long.fromInt(0))
        expect(longFromBuffer(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]))).toEqual(Long.fromBits(0x04030201, 0x08070605))
    })

    it('should correctly read BE longs', () => {
        expect(longFromBuffer(new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0]), false, false)).toEqual(Long.fromInt(0))
        expect(longFromBuffer(new Uint8Array([8, 7, 6, 5, 4, 3, 2, 1]), false, false)).toEqual(
            Long.fromBits(0x04030201, 0x08070605),
        )
    })
})

describe('removeFromLongArray', () => {
    it('should remove a Long from an array', () => {
        const arr = [Long.fromInt(1), Long.fromInt(2), Long.fromInt(3)]

        expect(removeFromLongArray(arr, Long.fromInt(2))).toBeTruthy()
        expect(arr).toEqual([Long.fromInt(1), Long.fromInt(3)])
    })

    it('should return false if the Long was not found', () => {
        const arr = [Long.fromInt(1), Long.fromInt(2), Long.fromInt(3)]

        expect(removeFromLongArray(arr, Long.fromInt(4))).toBeFalsy()
        expect(arr).toEqual([Long.fromInt(1), Long.fromInt(2), Long.fromInt(3)])
    })

    it('should only remove one matching element', () => {
        const arr = [Long.fromInt(1), Long.fromInt(2), Long.fromInt(2), Long.fromInt(3)]

        expect(removeFromLongArray(arr, Long.fromInt(2))).toBeTruthy()
        expect(arr).toEqual([Long.fromInt(1), Long.fromInt(2), Long.fromInt(3)])
    })
})

describe('longToFastString', () => {
    it('should correctly serialize a Long', () => {
        expect(longToFastString(Long.fromInt(0))).toEqual('0|0')
        expect(longToFastString(Long.fromBits(123, 456))).toEqual('123|456')
    })

    it('should work with negative numbers', () => {
        expect(longToFastString(Long.fromInt(-1))).toEqual('-1|-1')
        expect(longToFastString(Long.fromBits(-123, -456))).toEqual('-123|-456')
    })
})

describe('longFromFastString', () => {
    it('should correctly deserialize a Long', () => {
        expect(longFromFastString('0|0')).toEqual(Long.fromInt(0))
        expect(longFromFastString('123|456')).toEqual(Long.fromBits(123, 456))
    })

    it('should work with negative numbers', () => {
        expect(longFromFastString('-1|-1')).toEqual(Long.fromInt(-1))
        expect(longFromFastString('-123|-456')).toEqual(Long.fromBits(-123, -456))
    })

    it('should throw on invalid strings', () => {
        expect(() => longFromFastString('0')).toThrow()
        expect(() => longFromFastString('0|0|0')).toThrow()
        expect(() => longFromFastString('abc|def')).toThrow()
    })
})

describe('LongMap', () => {
    it('should set and get values', () => {
        const map = new LongMap<string>()

        map.set(Long.fromInt(123), 'test')

        expect(map.get(Long.fromInt(123))).toEqual('test')
    })

    it('should return undefined for non-existing keys', () => {
        const map = new LongMap<string>()

        expect(map.get(Long.fromInt(123))).toEqual(undefined)
    })

    it('should check for existing keys', () => {
        const map = new LongMap<string>()

        map.set(Long.fromInt(123), 'test')

        expect(map.has(Long.fromInt(123))).toBeTruthy()
        expect(map.has(Long.fromInt(456))).toBeFalsy()
    })

    it('should delete keys', () => {
        const map = new LongMap<string>()

        map.set(Long.fromInt(123), 'test')
        map.delete(Long.fromInt(123))

        expect(map.has(Long.fromInt(123))).toBeFalsy()
    })

    it('should iterate over keys', () => {
        const map = new LongMap<string>()

        map.set(Long.fromInt(123), 'test')
        map.set(Long.fromInt(456), 'test2')

        expect([...map.keys()]).toEqual([Long.fromInt(123), Long.fromInt(456)])
    })

    it('should iterate over values', () => {
        const map = new LongMap<string>()

        map.set(Long.fromInt(123), 'test')
        map.set(Long.fromInt(456), 'test2')

        expect([...map.values()]).toEqual(['test', 'test2'])
    })

    it('should clear', () => {
        const map = new LongMap<string>()

        map.set(Long.fromInt(123), 'test')
        map.set(Long.fromInt(456), 'test2')

        map.clear()

        expect(map.has(Long.fromInt(123))).toBeFalsy()
        expect(map.has(Long.fromInt(456))).toBeFalsy()
    })

    it('should return the size', () => {
        const map = new LongMap<string>()

        map.set(Long.fromInt(123), 'test')
        map.set(Long.fromInt(456), 'test2')

        expect(map.size()).toEqual(2)
    })
})

describe('LongSet', () => {
    it('should add and check for values', () => {
        const set = new LongSet()

        set.add(Long.fromInt(123))

        expect(set.has(Long.fromInt(123))).toBeTruthy()
    })

    it('should remove values', () => {
        const set = new LongSet()

        set.add(Long.fromInt(123))
        set.add(Long.fromInt(456))
        set.delete(Long.fromInt(123))

        expect(set.has(Long.fromInt(123))).toBeFalsy()
    })

    it('should return the size', () => {
        const set = new LongSet()

        set.add(Long.fromInt(123))
        set.add(Long.fromInt(456))

        expect(set.size).toEqual(2)
    })

    it('should clear', () => {
        const set = new LongSet()

        set.add(Long.fromInt(123))
        set.add(Long.fromInt(456))

        set.clear()

        expect(set.has(Long.fromInt(123))).toBeFalsy()
        expect(set.has(Long.fromInt(456))).toBeFalsy()
    })

    it('should return the size', () => {
        const set = new LongSet()

        set.add(Long.fromInt(123))
        set.add(Long.fromInt(456))

        expect(set.size).toEqual(2)
    })

    it('should convert to array', () => {
        const set = new LongSet()

        set.add(Long.fromInt(123))
        set.add(Long.fromInt(456))

        expect(set.toArray()).toEqual([Long.fromInt(123), Long.fromInt(456)])
    })
})
