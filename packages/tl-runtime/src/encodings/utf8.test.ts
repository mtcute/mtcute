import { describe, expect, it } from 'vitest'

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const _imported = await import(import.meta.env.TEST_ENV === 'node' ? './utf8.js' : './utf8.web.js')
const { byteLengthUtf8, utf8Decode, utf8Encode, utf8EncodeToBuffer } = _imported as typeof import('./utf8.js')

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

describe('byteLengthUtf8', () => {
    it('should return byte length of utf8 string', () => {
        expect(byteLengthUtf8('abcd')).toEqual(4)
    })

    it('should properly handle utf8 string with non-ascii characters', () => {
        expect(byteLengthUtf8('абвг')).toEqual(8)
        expect(byteLengthUtf8('🌸')).toEqual(4)
    })
})
