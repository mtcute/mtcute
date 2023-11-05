import { expect } from 'chai'
import { describe, it } from 'mocha'

import { hexEncode, utf8Decode, utf8EncodeToBuffer } from '@mtcute/tl-runtime'

import { buffersEqual, bufferToReversed, cloneBuffer, concatBuffers, randomBytes } from '../src/utils/buffer-utils.js'
import { xorBuffer, xorBufferInPlace } from '../src/utils/crypto/utils.js'

describe('buffersEqual', () => {
    it('should return true for equal buffers', () => {
        expect(buffersEqual(new Uint8Array([]), new Uint8Array([]))).is.true
        expect(buffersEqual(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 3]))).is.true
    })

    it('should return false for non-equal buffers', () => {
        expect(buffersEqual(new Uint8Array([1]), new Uint8Array([]))).is.false
        expect(buffersEqual(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 4]))).is.false
    })
})

describe('xorBuffer', () => {
    it('should xor buffers without modifying original', () => {
        const data = utf8EncodeToBuffer('hello')
        const key = utf8EncodeToBuffer('xor')

        const xored = xorBuffer(data, key)
        expect(data.toString()).eq('hello')
        expect(key.toString()).eq('xor')
        expect(hexEncode(xored)).eq('100a1e6c6f')
    })

    it('should be deterministic', () => {
        const data = utf8EncodeToBuffer('hello')
        const key = utf8EncodeToBuffer('xor')

        const xored1 = xorBuffer(data, key)
        expect(hexEncode(xored1)).eq('100a1e6c6f')

        const xored2 = xorBuffer(data, key)
        expect(hexEncode(xored2)).eq('100a1e6c6f')
    })

    it('second call should decode content', () => {
        const data = utf8EncodeToBuffer('hello')
        const key = utf8EncodeToBuffer('xor')

        const xored1 = xorBuffer(data, key)
        expect(hexEncode(xored1)).eq('100a1e6c6f')

        const xored2 = xorBuffer(xored1, key)
        expect(utf8Decode(xored2)).eq('hello')
    })
})

describe('xorBufferInPlace', () => {
    it('should xor buffers by modifying original', () => {
        const data = utf8EncodeToBuffer('hello')
        const key = utf8EncodeToBuffer('xor')

        xorBufferInPlace(data, key)
        expect(hexEncode(data)).eq('100a1e6c6f')
        expect(key.toString()).eq('xor')
    })

    it('second call should decode content', () => {
        const data = utf8EncodeToBuffer('hello')
        const key = utf8EncodeToBuffer('xor')

        xorBufferInPlace(data, key)
        expect(hexEncode(data)).eq('100a1e6c6f')

        xorBufferInPlace(data, key)
        expect(data.toString()).eq('hello')
    })
})

describe('randomBytes', () => {
    it('should return exactly N bytes', () => {
        expect(randomBytes(0).length).eq(0)
        expect(randomBytes(5).length).eq(5)
        expect(randomBytes(10).length).eq(10)
        expect(randomBytes(256).length).eq(256)
    })

    it('should not be deterministic', () => {
        expect([...randomBytes(8)]).not.eql([...randomBytes(8)])
    })
})

describe('cloneBuffer', () => {
    it('should clone buffer', () => {
        const orig = new Uint8Array([1, 2, 3])
        const copy = cloneBuffer(orig)

        expect([...copy]).eql([1, 2, 3])
        orig[0] = 0xff
        expect(copy[0]).not.eql(0xff)
    })

    it('should clone buffer partially', () => {
        const orig = new Uint8Array([1, 2, 3, 4, 5])
        const copy = cloneBuffer(orig, 1, 4)

        expect([...copy]).eql([2, 3, 4])
        orig[0] = 0xff
        expect(copy[0]).not.eql(0xff)
    })
})

describe('concatBuffers', () => {
    it('should concat buffers', () => {
        const buf = concatBuffers([new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6])])

        expect([...buf]).eql([1, 2, 3, 4, 5, 6])
    })

    it('should create a new buffer', () => {
        const buf1 = new Uint8Array([1, 2, 3])
        const buf2 = new Uint8Array([4, 5, 6])
        const buf = concatBuffers([buf1, buf2])

        buf[0] = 0xff
        expect(buf1[0]).not.eql(0xff)
    })
})

describe('bufferToReversed', () => {
    it('should reverse the buffer', () => {
        const buf = bufferToReversed(new Uint8Array([1, 2, 3, 4, 5, 6]))

        expect([...buf]).eql([6, 5, 4, 3, 2, 1])
    })

    it('should reverse a part of the buffer', () => {
        const buf = bufferToReversed(new Uint8Array([1, 2, 3, 4, 5, 6]), 1, 5)

        expect([...buf]).eql([5, 4, 3, 2])
    })

    it('should create a new buffer', () => {
        const buf1 = new Uint8Array([1, 2, 3])
        const buf2 = bufferToReversed(buf1)

        buf2[0] = 0xff
        expect([...buf1]).eql([1, 2, 3])
    })
})
