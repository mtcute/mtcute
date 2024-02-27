import { describe, expect, it } from 'vitest'

import { getPlatform } from '../../platform.js'
import { xorBuffer, xorBufferInPlace } from './utils.js'

const p = getPlatform()

describe('xorBuffer', () => {
    it('should xor buffers without modifying original', () => {
        const data = p.utf8Encode('hello')
        const key = p.utf8Encode('xor')

        const xored = xorBuffer(data, key)
        expect(p.utf8Decode(data)).eq('hello')
        expect(p.utf8Decode(key)).eq('xor')
        expect(p.hexEncode(xored)).eq('100a1e6c6f')
    })

    it('should be deterministic', () => {
        const data = p.utf8Encode('hello')
        const key = p.utf8Encode('xor')

        const xored1 = xorBuffer(data, key)
        expect(p.hexEncode(xored1)).eq('100a1e6c6f')

        const xored2 = xorBuffer(data, key)
        expect(p.hexEncode(xored2)).eq('100a1e6c6f')
    })

    it('second call should decode content', () => {
        const data = p.utf8Encode('hello')
        const key = p.utf8Encode('xor')

        const xored1 = xorBuffer(data, key)
        expect(p.hexEncode(xored1)).eq('100a1e6c6f')

        const xored2 = xorBuffer(xored1, key)
        expect(p.utf8Decode(xored2)).eq('hello')
    })
})

describe('xorBufferInPlace', () => {
    it('should xor buffers by modifying original', () => {
        const data = p.utf8Encode('hello')
        const key = p.utf8Encode('xor')

        xorBufferInPlace(data, key)
        expect(p.hexEncode(data)).eq('100a1e6c6f')
        expect(p.utf8Decode(key)).eq('xor')
    })

    it('second call should decode content', () => {
        const data = p.utf8Encode('hello')
        const key = p.utf8Encode('xor')

        xorBufferInPlace(data, key)
        expect(p.hexEncode(data)).eq('100a1e6c6f')

        xorBufferInPlace(data, key)
        expect(p.utf8Decode(data)).eq('hello')
    })
})
