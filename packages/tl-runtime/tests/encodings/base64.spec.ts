import { expect } from 'chai'
import { describe, it } from 'mocha'

import { base64Decode, base64DecodeToBuffer, base64Encode } from '../../src/encodings/base64.js'
import { base64Decode as base64DecodeWeb, base64Encode as base64EncodeWeb } from '../../src/encodings/base64.web.js'

describe('base64', () => {
    it('should decode base64 string to existing buffer', () => {
        const buf = new Uint8Array(4)
        base64Decode(buf, 'AQIDBA==')
        expect(buf).eql(new Uint8Array([1, 2, 3, 4]))
    })

    it('should decode base64 string to new buffer', () => {
        const buf = base64DecodeToBuffer('AQIDBA==')
        expect(buf).eql(new Uint8Array([1, 2, 3, 4]))
    })

    it('should encode buffer to base64 string', () => {
        const buf = new Uint8Array([1, 2, 3, 4])
        expect(base64Encode(buf)).eq('AQIDBA==')
    })

    it('should decode url-safe base64 string to existing buffer', () => {
        const buf = new Uint8Array(4)
        base64Decode(buf, 'AQIDBA', true)
        expect(buf).eql(new Uint8Array([1, 2, 3, 4]))
    })

    it('should decode url-safe base64 string to new buffer', () => {
        const buf = base64DecodeToBuffer('AQIDBA', true)
        expect(buf).eql(new Uint8Array([1, 2, 3, 4]))
    })

    it('should encode buffer to url-safe base64 string', () => {
        const buf = new Uint8Array([1, 2, 3, 4])
        expect(base64Encode(buf, true)).eq('AQIDBA')
    })
})

describe('base64.web', () => {
    it('should decode base64 string to existing buffer', () => {
        const buf = new Uint8Array(4)
        base64DecodeWeb(buf, 'AQIDBA==')
        expect(buf).eql(new Uint8Array([1, 2, 3, 4]))
    })

    it('should decode base64 string to new buffer', () => {
        const buf = base64DecodeToBuffer('AQIDBA==')
        expect(buf).eql(new Uint8Array([1, 2, 3, 4]))
    })

    it('should encode buffer to base64 string', () => {
        const buf = new Uint8Array([1, 2, 3, 4])
        expect(base64EncodeWeb(buf)).eq('AQIDBA==')
    })

    it('should decode url-safe base64 string to existing buffer', () => {
        const buf = new Uint8Array(4)
        base64DecodeWeb(buf, 'AQIDBA', true)
        expect(buf).eql(new Uint8Array([1, 2, 3, 4]))
    })

    it('should decode url-safe base64 string to new buffer', () => {
        const buf = base64DecodeToBuffer('AQIDBA', true)
        expect(buf).eql(new Uint8Array([1, 2, 3, 4]))
    })

    it('should encode buffer to url-safe base64 string', () => {
        const buf = new Uint8Array([1, 2, 3, 4])
        expect(base64EncodeWeb(buf, true)).eq('AQIDBA')
    })
})
