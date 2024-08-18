import { describe, expect, it } from 'vitest'
import { getPlatform } from '@mtcute/core/platform.js'

const p = getPlatform()

describe('base64', () => {
    it('should decode base64 string to new buffer', () => {
        const buf = p.base64Decode('AQIDBA==')
        expect(new Uint8Array(buf)).toEqual(new Uint8Array([1, 2, 3, 4]))
    })

    it('should encode buffer to base64 string', () => {
        const buf = new Uint8Array([1, 2, 3, 4])
        expect(p.base64Encode(buf)).toEqual('AQIDBA==')
    })

    it('should decode url-safe base64 string to new buffer', () => {
        const buf = p.base64Decode('AQIDBA', true)
        expect(new Uint8Array(buf)).toEqual(new Uint8Array([1, 2, 3, 4]))
    })

    it('should encode buffer to url-safe base64 string', () => {
        const buf = new Uint8Array([1, 2, 3, 4])
        expect(p.base64Encode(buf, true)).toEqual('AQIDBA')
    })
})

describe('hex', () => {
    it('should decode hex string to new buffer', () => {
        const buf = p.hexDecode('01020304')
        expect(new Uint8Array(buf)).toEqual(new Uint8Array([1, 2, 3, 4]))
    })

    it('should encode buffer to hex string', () => {
        const buf = new Uint8Array([1, 2, 3, 4])
        expect(p.hexEncode(buf)).toEqual('01020304')
    })
})

describe('utf8', () => {
    it('should encode utf8 string into new buffer', () => {
        const buf = p.utf8Encode('abcd')
        expect(new Uint8Array(buf)).toEqual(new Uint8Array([97, 98, 99, 100]))
    })

    it('should decode utf8 string from existing buffer', () => {
        const buf = new Uint8Array([97, 98, 99, 100])
        expect(p.utf8Decode(buf)).toEqual('abcd')
    })

    it('should return byte length of utf8 string', () => {
        expect(p.utf8ByteLength('abcd')).toEqual(4)
    })

    it('should properly handle utf8 string with non-ascii characters', () => {
        expect(p.utf8ByteLength('абвг')).toEqual(8)
        expect(p.utf8ByteLength('🌸')).toEqual(4)
    })
})
