import { describe, expect, it } from 'vitest'
import { hex, utf8 } from '@fuman/utils'

import { xorBuffer, xorBufferInPlace } from './utils.js'

describe('xorBuffer', () => {
    it('should xor buffers without modifying original', () => {
        const data = utf8.encoder.encode('hello')
        const key = utf8.encoder.encode('xor')

        const xored = xorBuffer(data, key)
        expect(utf8.decoder.decode(data)).eq('hello')
        expect(utf8.decoder.decode(key)).eq('xor')
        expect(hex.encode(xored)).eq('100a1e6c6f')
    })

    it('should be deterministic', () => {
        const data = utf8.encoder.encode('hello')
        const key = utf8.encoder.encode('xor')

        const xored1 = xorBuffer(data, key)
        expect(hex.encode(xored1)).eq('100a1e6c6f')

        const xored2 = xorBuffer(data, key)
        expect(hex.encode(xored2)).eq('100a1e6c6f')
    })

    it('second call should decode content', () => {
        const data = utf8.encoder.encode('hello')
        const key = utf8.encoder.encode('xor')

        const xored1 = xorBuffer(data, key)
        expect(hex.encode(xored1)).eq('100a1e6c6f')

        const xored2 = xorBuffer(xored1, key)
        expect(utf8.decoder.decode(xored2)).eq('hello')
    })
})

describe('xorBufferInPlace', () => {
    it('should xor buffers by modifying original', () => {
        const data = utf8.encoder.encode('hello')
        const key = utf8.encoder.encode('xor')

        xorBufferInPlace(data, key)
        expect(hex.encode(data)).eq('100a1e6c6f')
        expect(utf8.decoder.decode(key)).eq('xor')
    })

    it('second call should decode content', () => {
        const data = utf8.encoder.encode('hello')
        const key = utf8.encoder.encode('xor')

        xorBufferInPlace(data, key)
        expect(hex.encode(data)).eq('100a1e6c6f')

        xorBufferInPlace(data, key)
        expect(utf8.decoder.decode(data)).eq('hello')
    })
})
