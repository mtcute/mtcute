import { describe, expect, it } from 'vitest'

import { hexEncode, utf8Decode, utf8EncodeToBuffer } from '@mtcute/tl-runtime'

import { xorBuffer, xorBufferInPlace } from './utils.js'

describe('xorBuffer', () => {
    it('should xor buffers without modifying original', () => {
        const data = utf8EncodeToBuffer('hello')
        const key = utf8EncodeToBuffer('xor')

        const xored = xorBuffer(data, key)
        expect(utf8Decode(data)).eq('hello')
        expect(utf8Decode(key)).eq('xor')
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
        expect(utf8Decode(key)).eq('xor')
    })

    it('second call should decode content', () => {
        const data = utf8EncodeToBuffer('hello')
        const key = utf8EncodeToBuffer('xor')

        xorBufferInPlace(data, key)
        expect(hexEncode(data)).eq('100a1e6c6f')

        xorBufferInPlace(data, key)
        expect(utf8Decode(data)).eq('hello')
    })
})
