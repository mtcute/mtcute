import { describe, expect, it } from 'vitest'

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const _imported = await import(
    import.meta.env.TEST_ENV === 'node' || import.meta.env.TEST_ENV === 'bun' ? './base64.js' : './base64.web.js'
)
const { base64Decode, base64DecodeToBuffer, base64Encode } = _imported as typeof import('./base64.js')

describe('base64', () => {
    it('should decode base64 string to existing buffer', () => {
        const buf = new Uint8Array(4)
        base64Decode(buf, 'AQIDBA==')
        expect(buf).toEqual(new Uint8Array([1, 2, 3, 4]))
    })

    it('should decode base64 string to new buffer', () => {
        const buf = base64DecodeToBuffer('AQIDBA==')
        expect(new Uint8Array(buf)).toEqual(new Uint8Array([1, 2, 3, 4]))
    })

    it('should encode buffer to base64 string', () => {
        const buf = new Uint8Array([1, 2, 3, 4])
        expect(base64Encode(buf)).toEqual('AQIDBA==')
    })

    it('should decode url-safe base64 string to existing buffer', () => {
        const buf = new Uint8Array(4)
        base64Decode(buf, 'AQIDBA', true)
        expect(buf).toEqual(new Uint8Array([1, 2, 3, 4]))
    })

    it('should decode url-safe base64 string to new buffer', () => {
        const buf = base64DecodeToBuffer('AQIDBA', true)
        expect(new Uint8Array(buf)).toEqual(new Uint8Array([1, 2, 3, 4]))
    })

    it('should encode buffer to url-safe base64 string', () => {
        const buf = new Uint8Array([1, 2, 3, 4])
        expect(base64Encode(buf, true)).toEqual('AQIDBA')
    })
})
