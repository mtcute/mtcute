import { describe, expect, it } from 'vitest'

import { hexDecode, hexDecodeToBuffer, hexEncode } from './hex.js'
import {
    hexDecode as hexDecodeWeb,
    hexDecodeToBuffer as hexDecodeToBufferWeb,
    hexEncode as hexEncodeWeb,
} from './hex.web.js'

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

describe('hex.web', () => {
    it('should decode hex string to existing buffer', () => {
        const buf = new Uint8Array(4)
        hexDecodeWeb(buf, '01020304')
        expect(buf).toEqual(new Uint8Array([1, 2, 3, 4]))
    })

    it('should decode hex string to new buffer', () => {
        const buf = hexDecodeToBufferWeb('01020304')
        expect(buf).toEqual(new Uint8Array([1, 2, 3, 4]))
    })

    it('should encode buffer to hex string', () => {
        const buf = new Uint8Array([1, 2, 3, 4])
        expect(hexEncodeWeb(buf)).toEqual('01020304')
    })
})
