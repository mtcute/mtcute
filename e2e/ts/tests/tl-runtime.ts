/* eslint-disable */
import { expect } from 'chai'
import Long from 'long'
import { describe, it } from 'mocha'

import {
    hexDecode,
    hexDecodeToBuffer,
    hexEncode,
    TlBinaryReader,
    TlBinaryWriter,
    TlSerializationCounter,
} from '@mtcute/tl-runtime'

// here we primarily want to check that everything imports properly,
// and that the code is actually executable. The actual correctness
// of the implementation is covered tested by unit tests

describe('encodings', () => {
    it('works with Buffers', () => {
        const buf = Buffer.alloc(5)
        hexDecode(buf, '0102030405')

        expect(hexEncode(Buffer.from('hello'))).to.equal('68656c6c6f')
        expect(buf).eql(Buffer.from([1, 2, 3, 4, 5]))
    })

    it('works with Uint8Arrays', () => {
        const buf = new Uint8Array(5)
        hexDecode(buf, '0102030405')

        expect(hexEncode(new Uint8Array([1, 2, 3, 4, 5]))).to.equal('0102030405')
        expect(buf).eql(new Uint8Array([1, 2, 3, 4, 5]))
    })
})

describe('TlBinaryReader', () => {
    const map = {
        '85337187': function (r: any) {
            const ret: any = {}
            ret._ = 'mt_resPQ'
            ret.nonce = r.int128()
            ret.serverNonce = r.int128()
            ret.pq = r.bytes()
            ret.serverPublicKeyFingerprints = r.vector(r.long)

            return ret
        },
    }
    const data =
        '000000000000000001c8831ec97ae55140000000632416053e0549828cca27e966b301a48fece2fca5cf4d33f4a11ea877ba4aa5739073300817ed48941a08f98100000015c4b51c01000000216be86c022bb4c3'

    it('should work with Buffers', () => {
        const buf = Buffer.from(data, 'hex')
        const r = new TlBinaryReader(map, buf, 8)

        expect(r.long().toString(16)).to.equal('51e57ac91e83c801')
        expect(r.uint()).to.equal(64)

        const obj: any = r.object()
        expect(obj._).equal('mt_resPQ')
    })

    it('should work with Uint8Arrays', () => {
        const buf = hexDecodeToBuffer(data)

        const r = new TlBinaryReader(map, buf, 8)

        expect(r.long().toString(16)).to.equal('51e57ac91e83c801')
        expect(r.uint()).to.equal(64)

        const obj: any = r.object()
        expect(obj._).equal('mt_resPQ')
    })
})

describe('TlBinaryWriter', () => {
    const map = {
        mt_resPQ: function (w: any, obj: any) {
            w.uint(85337187)
            w.bytes(obj.pq)
            w.vector(w.long, obj.serverPublicKeyFingerprints)
        },
        _staticSize: {} as any
    }

    it('should work with Buffers', () => {
        const obj = {
            _: 'mt_resPQ',
            pq: Buffer.from('17ED48941A08F981', 'hex'),
            serverPublicKeyFingerprints: [Long.fromString('c3b42b026ce86b21', 16)],
        }

        expect(TlSerializationCounter.countNeededBytes(map, obj)).to.equal(32)

        const w = TlBinaryWriter.alloc(map, 48)
        w.long(Long.ZERO)
        w.long(Long.fromString('51E57AC91E83C801', true, 16)) // messageId
        w.object(obj)

        expect(hexEncode(w.result())).eq(
            '000000000000000001c8831ec97ae551632416050817ed48941a08f98100000015c4b51c01000000216be86c022bb4c3',
        )
    })

    it('should work with Uint8Arrays', () => {
        const obj = {
            _: 'mt_resPQ',
            pq: hexDecodeToBuffer('17ED48941A08F981'),
            serverPublicKeyFingerprints: [Long.fromString('c3b42b026ce86b21', 16)],
        }

        expect(TlSerializationCounter.countNeededBytes(map, obj)).to.equal(32)

        const w = TlBinaryWriter.alloc(map, 48)
        w.long(Long.ZERO)
        w.long(Long.fromString('51E57AC91E83C801', true, 16)) // messageId
        w.object(obj)

        expect(hexEncode(w.result())).eq(
            '000000000000000001c8831ec97ae551632416050817ed48941a08f98100000015c4b51c01000000216be86c022bb4c3',
        )
    })
})
