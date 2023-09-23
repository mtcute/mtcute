import { expect } from 'chai'
import { describe, it } from 'mocha'

import {
    buffersEqual,
    cloneBuffer,
    encodeUrlSafeBase64,
    parseUrlSafeBase64,
    randomBytes,
    xorBuffer,
    xorBufferInPlace,
} from '../src/utils/buffer-utils'

describe('buffersEqual', () => {
    it('should return true for equal buffers', () => {
        expect(buffersEqual(Buffer.from([]), Buffer.from([]))).is.true
        expect(buffersEqual(Buffer.from([1, 2, 3]), Buffer.from([1, 2, 3]))).is.true
    })

    it('should return false for non-equal buffers', () => {
        expect(buffersEqual(Buffer.from([1]), Buffer.from([]))).is.false
        expect(buffersEqual(Buffer.from([1, 2, 3]), Buffer.from([1, 2, 4]))).is.false
    })
})

describe('xorBuffer', () => {
    it('should xor buffers without modifying original', () => {
        const data = Buffer.from('hello')
        const key = Buffer.from('xor')

        const xored = xorBuffer(data, key)
        expect(data.toString()).eq('hello')
        expect(key.toString()).eq('xor')
        expect(xored.toString('hex')).eq('100a1e6c6f')
    })

    it('should be deterministic', () => {
        const data = Buffer.from('hello')
        const key = Buffer.from('xor')

        const xored1 = xorBuffer(data, key)
        expect(xored1.toString('hex')).eq('100a1e6c6f')

        const xored2 = xorBuffer(data, key)
        expect(xored2.toString('hex')).eq('100a1e6c6f')
    })

    it('second call should decode content', () => {
        const data = Buffer.from('hello')
        const key = Buffer.from('xor')

        const xored1 = xorBuffer(data, key)
        expect(xored1.toString('hex')).eq('100a1e6c6f')

        const xored2 = xorBuffer(xored1, key)
        expect(xored2.toString()).eq('hello')
    })
})

describe('xorBufferInPlace', () => {
    it('should xor buffers by modifying original', () => {
        const data = Buffer.from('hello')
        const key = Buffer.from('xor')

        xorBufferInPlace(data, key)
        expect(data.toString('hex')).eq('100a1e6c6f')
        expect(key.toString()).eq('xor')
    })

    it('second call should decode content', () => {
        const data = Buffer.from('hello')
        const key = Buffer.from('xor')

        xorBufferInPlace(data, key)
        expect(data.toString('hex')).eq('100a1e6c6f')

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
        const orig = Buffer.from([1, 2, 3])
        const copy = cloneBuffer(orig)

        expect([...copy]).eql([1, 2, 3])
        orig[0] = 0xff
        expect(copy[0]).not.eql(0xff)
    })

    it('should clone buffer partially', () => {
        const orig = Buffer.from([1, 2, 3, 4, 5])
        const copy = cloneBuffer(orig, 1, 4)

        expect([...copy]).eql([2, 3, 4])
        orig[0] = 0xff
        expect(copy[0]).not.eql(0xff)
    })
})

describe('parseUrlSafeBase64', () => {
    it('should parse url-safe base64', () => {
        expect(parseUrlSafeBase64('qu7d8aGTeuF6-g').toString('hex')).eq('aaeeddf1a1937ae17afa')
    })
    it('should parse normal base64', () => {
        expect(parseUrlSafeBase64('qu7d8aGTeuF6+g==').toString('hex')).eq('aaeeddf1a1937ae17afa')
    })
})

describe('encodeUrlSafeBase64', () => {
    it('should encode to url-safe base64', () => {
        expect(encodeUrlSafeBase64(Buffer.from('aaeeddf1a1937ae17afa', 'hex'))).eq('qu7d8aGTeuF6-g')
    })
})
