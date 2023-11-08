import { describe, expect, it } from 'vitest'

import { byteLengthUtf8, utf8Decode, utf8Encode, utf8EncodeToBuffer } from './utf8.js'
import {
    byteLengthUtf8 as byteLengthUtf8Web,
    utf8Decode as utf8DecodeWeb,
    utf8Encode as utf8EncodeWeb,
    utf8EncodeToBuffer as utf8EncodeToBufferWeb,
} from './utf8.web.js'

// since we use TextEncoder or native Buffer, we can skip testing the utf8 encoding itself
// we only need to test that the functions work as expected with offsets and lengths

describe('utf8', () => {
    it('should encode utf8 string into existing buffer', () => {
        const buf = new Uint8Array(4)
        utf8Encode(buf, 'abcd')
        expect(buf).toEqual(new Uint8Array([97, 98, 99, 100]))
    })

    it('should encode utf8 string into new buffer', () => {
        const buf = utf8EncodeToBuffer('abcd')
        expect(new Uint8Array(buf)).toEqual(new Uint8Array([97, 98, 99, 100]))
    })

    it('should decode utf8 string from existing buffer', () => {
        const buf = new Uint8Array([97, 98, 99, 100])
        expect(utf8Decode(buf)).toEqual('abcd')
    })
})

describe('utf8.web', () => {
    it('should encode utf8 string into existing buffer', () => {
        const buf = new Uint8Array(4)
        utf8EncodeWeb(buf, 'abcd')
        expect(buf).toEqual(new Uint8Array([97, 98, 99, 100]))
    })

    it('should encode utf8 string into new buffer', () => {
        const buf = utf8EncodeToBufferWeb('abcd')
        expect(buf).toEqual(new Uint8Array([97, 98, 99, 100]))
    })

    it('should decode utf8 string from existing buffer', () => {
        const buf = new Uint8Array([97, 98, 99, 100])
        expect(utf8DecodeWeb(buf)).toEqual('abcd')
    })
})

describe('byteLengthUtf8', () => {
    it('should return byte length of utf8 string', () => {
        expect(byteLengthUtf8('abcd')).toEqual(4)
    })

    it('should properly handle utf8 string with non-ascii characters', () => {
        expect(byteLengthUtf8('абвг')).toEqual(8)
        expect(byteLengthUtf8('🌸')).toEqual(4)
    })

    it('should work in web', () => {
        expect(byteLengthUtf8Web('abcd')).toEqual(4)
        expect(byteLengthUtf8Web('абвг')).toEqual(8)
        expect(byteLengthUtf8Web('🌸')).toEqual(4)
    })
})
