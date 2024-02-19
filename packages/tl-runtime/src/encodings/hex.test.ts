import { describe, expect, it } from 'vitest'

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const _imported = await import(
    import.meta.env.TEST_ENV === 'node' || import.meta.env.TEST_ENV === 'bun' ? './hex.js' : './hex.web.js'
)
const { hexDecode, hexDecodeToBuffer, hexEncode } = _imported as typeof import('./hex.js')

describe('hex', () => {
    it('should decode hex string to existing buffer', () => {
        const buf = new Uint8Array(4)
        hexDecode(buf, '01020304')
        expect(buf).toEqual(new Uint8Array([1, 2, 3, 4]))
    })

    it('should decode hex string to new buffer', () => {
        const buf = hexDecodeToBuffer('01020304')
        expect(new Uint8Array(buf)).toEqual(new Uint8Array([1, 2, 3, 4]))
    })

    it('should encode buffer to hex string', () => {
        const buf = new Uint8Array([1, 2, 3, 4])
        expect(hexEncode(buf)).toEqual('01020304')
    })
})
