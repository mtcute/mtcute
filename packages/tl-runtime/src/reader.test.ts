// eslint-disable-next-line max-len
/* eslint-disable @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-argument */

import { randomBytes } from 'crypto'
import Long from 'long'
import { describe, expect, it } from 'vitest'

import { hexDecodeToBuffer, hexEncode } from './encodings/hex.js'
import { TlBinaryReader, TlReaderMap } from './reader.js'

describe('TlBinaryReader', () => {
    it('should read int32', () => {
        expect(TlBinaryReader.manual(new Uint8Array([0, 0, 0, 0])).int()).toEqual(0)
        expect(TlBinaryReader.manual(new Uint8Array([1, 0, 0, 0])).int()).toEqual(1)
        expect(TlBinaryReader.manual(new Uint8Array([1, 2, 3, 4])).int()).toEqual(67305985)
        expect(TlBinaryReader.manual(new Uint8Array([0xff, 0xff, 0xff, 0xff])).int()).toEqual(-1)
    })

    it('should read uint32', () => {
        expect(TlBinaryReader.manual(new Uint8Array([0, 0, 0, 0])).uint()).toEqual(0)
        expect(TlBinaryReader.manual(new Uint8Array([1, 0, 0, 0])).uint()).toEqual(1)
        expect(TlBinaryReader.manual(new Uint8Array([1, 2, 3, 4])).uint()).toEqual(67305985)
        expect(TlBinaryReader.manual(new Uint8Array([0xff, 0xff, 0xff, 0xff])).uint()).toEqual(4294967295)
    })

    it('should read int53', () => {
        expect(TlBinaryReader.manual(new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0])).int53()).toEqual(0)
        expect(TlBinaryReader.manual(new Uint8Array([1, 0, 0, 0, 0, 0, 0, 0])).int53()).toEqual(1)
        expect(TlBinaryReader.manual(new Uint8Array([1, 2, 3, 4, 0, 0, 0, 0])).int53()).toEqual(67305985)
        expect(TlBinaryReader.manual(new Uint8Array([1, 0, 1, 0, 1, 0, 1, 0])).int53()).toEqual(281479271743489)
        expect(TlBinaryReader.manual(new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff])).int53()).toEqual(
            -1,
        )
    })

    it('should read long', () => {
        expect(
            TlBinaryReader.manual(new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]))
                .long()
                .toString(),
        ).toEqual('-1')
        expect(
            TlBinaryReader.manual(new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x12, 0x34, 0x56, 0x78]))
                .long()
                .toString(),
        ).toEqual('8671175386481439762')
        expect(
            TlBinaryReader.manual(new Uint8Array([0x15, 0xc4, 0x15, 0xb5, 0xc4, 0x1c, 0x03, 0xa3]))
                .long()
                .toString(),
        ).toEqual('-6700480189419895787')
    })

    it('should read float', () => {
        expect(TlBinaryReader.manual(new Uint8Array([0, 0, 0x80, 0x3f])).float()).toBeCloseTo(1, 0.001)
        expect(TlBinaryReader.manual(new Uint8Array([0xb6, 0xf3, 0x9d, 0x3f])).float()).toBeCloseTo(1.234, 0.001)
        expect(TlBinaryReader.manual(new Uint8Array([0xfa, 0x7e, 0x2a, 0x3f])).float()).toBeCloseTo(0.666, 0.001)
    })

    it('should read double', () => {
        expect(TlBinaryReader.manual(new Uint8Array([0, 0, 0, 0, 0, 0, 0xf0, 0x3f])).double()).toBeCloseTo(1, 0.001)
        expect(TlBinaryReader.manual(new Uint8Array([0, 0, 0, 0, 0, 0, 0x25, 0x40])).double()).toBeCloseTo(10.5, 0.001)
        expect(
            TlBinaryReader.manual(new Uint8Array([0x9a, 0x99, 0x99, 0x99, 0x99, 0x99, 0x21, 0x40])).double(),
        ).toBeCloseTo(8.8, 0.001)
    })

    it('should read raw bytes', () => {
        expect([...TlBinaryReader.manual(new Uint8Array([1, 2, 3, 4])).raw(2)]).toEqual([1, 2])
        expect([...TlBinaryReader.manual(new Uint8Array([1, 2, 3, 4])).raw()]).toEqual([1, 2, 3, 4])
        expect([...TlBinaryReader.manual(new Uint8Array([1, 2, 3, 4])).raw(0)]).toEqual([])
    })

    it('should move cursor', () => {
        const reader = TlBinaryReader.manual(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]))

        reader.int()
        expect(reader.pos).toEqual(4)
        reader.seek(-4)
        expect(reader.pos).toEqual(0)

        expect(() => reader.seek(-1)).toThrow(RangeError)
        expect(() => reader.seek(1000)).toThrow(RangeError)

        reader.uint()
        expect(reader.pos).toEqual(4)
        reader.seekTo(0)
        expect(reader.pos).toEqual(0)

        expect(() => reader.seekTo(-1)).toThrow(RangeError)
        expect(() => reader.seekTo(1000)).toThrow(RangeError)

        const checkFunction = (fn: () => void, sz: number) => {
            fn()
            expect(reader.pos).toEqual(sz)
            reader.seekTo(0)
        }

        checkFunction(() => reader.long(), 8)
        checkFunction(() => reader.float(), 4)
        checkFunction(() => reader.double(), 8)
        checkFunction(() => reader.raw(5), 5)
    })

    it('should read tg-encoded bytes', () => {
        expect([...TlBinaryReader.manual(new Uint8Array([1, 2, 3, 4])).bytes()]).toEqual([2])

        const random250bytes = randomBytes(250)
        let reader = TlBinaryReader.manual(new Uint8Array([250, ...random250bytes, 0, 0, 0, 0, 0]))
        expect([...reader.bytes()]).toEqual([...random250bytes])
        expect(reader.pos).toEqual(252)

        const random1000bytes = randomBytes(1000)
        // eslint-disable-next-line no-restricted-globals
        const buffer = Buffer.alloc(1010)
        buffer[0] = 254
        buffer.writeIntLE(1000, 1, 3)
        buffer.set(random1000bytes, 4)
        reader = TlBinaryReader.manual(buffer)
        expect([...reader.bytes()]).toEqual([...random1000bytes])
        expect(reader.pos).toEqual(1004)
    })

    const stubObjectsMap: TlReaderMap = {
        '3735928559': function (r) {
            return { a: r.int(), b: r.object() }
        },
        '3131949278': function (r) {
            return r.uint()
        },
        '4207861421': () => 42,
        '3200191549': function (r) {
            return { vec: r.vector(r.uint) }
        },
    }

    it('should read tg-encoded objects', () => {
        const buffer = new Uint8Array([
            0xef,
            0xbe,
            0xad,
            0xde, // 0xdeadbeef object
            /**/ 0x01,
            0x00,
            0x00,
            0x00, // a = int32 1
            /**/ 0xad,
            0xde,
            0xce,
            0xfa, // b = 0xfacedead object (aka constant 42)

            0xde,
            0xc0,
            0xad,
            0xba, // 0xbaadc0de object
            /**/ 0x02,
            0x00,
            0x00,
            0x00, // int32 2
        ])
        const reader = new TlBinaryReader(stubObjectsMap, buffer)

        const deadBeef = reader.object()
        expect(deadBeef).toEqual({ a: 1, b: 42 })
        const baadCode = reader.object()
        expect(baadCode).toEqual(2)
    })

    it('should read tg-encoded vectors', () => {
        const buffer = new Uint8Array([
            0x15,
            0xc4,
            0xb5,
            0x1c, // 0x1cb5c415 object (vector)
            /**/ 0x03,
            0x00,
            0x00,
            0x00, // vector size (3)

            /**/ 0xef,
            0xbe,
            0xad,
            0xde, // 0xdeadbeef object
            /****/ 0x01,
            0x00,
            0x00,
            0x00, // a = int32 1
            /****/ 0xad,
            0xde,
            0xce,
            0xfa, // 0xfacedead object (aka constant 42)

            /**/ 0xde,
            0xc0,
            0xad,
            0xba, // 0xbaadc0de object
            /****/ 0x02,
            0x00,
            0x00,
            0x00, // int32 2

            /**/ 0x3d,
            0x0c,
            0xbf,
            0xbe, // 0xbebf0c3d object
            /****/ 0x15,
            0xc4,
            0xb5,
            0x1c, // 0x1cb5c415 object (vector)
            /******/ 0x02,
            0x00,
            0x00,
            0x00, // vector size (2)
            /******/ 0x01,
            0x00,
            0x00,
            0x00, // int32 1
            /******/ 0x02,
            0x00,
            0x00,
            0x00, // int32 2
        ])
        const reader = new TlBinaryReader(stubObjectsMap, buffer)

        const vector = reader.vector()
        expect(vector).toEqual([{ a: 1, b: 42 }, 2, { vec: [1, 2] }])

        reader.seekTo(0)
        const vectorObj = reader.object()
        expect(vector).toEqual(vectorObj)
    })

    describe('examples from documentation', () => {
        // https://core.telegram.org/mtproto/samples-auth_key#2-a-response-from-the-server-has-been-received-with-the-following-content
        it('should be able to read resPQ', () => {
            const input =
                '000000000000000001c8831ec97ae55140000000632416053e0549828cca27e966b301a48fece2fca5cf4d33f4a11ea877ba4aa5739073300817ed48941a08f98100000015c4b51c01000000216be86c022bb4c3'
            const map: TlReaderMap = {
                '85337187': function (r) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const ret: any = {}
                    ret._ = 'mt_resPQ'
                    ret.nonce = r.int128()
                    ret.serverNonce = r.int128()
                    ret.pq = r.bytes()
                    ret.serverPublicKeyFingerprints = r.vector(r.long)

                    return ret
                },
            }

            const expected = {
                nonce: hexDecodeToBuffer('3E0549828CCA27E966B301A48FECE2FC'),
                serverNonce: hexDecodeToBuffer('A5CF4D33F4A11EA877BA4AA573907330'),
                pq: hexDecodeToBuffer('17ED48941A08F981'),
                serverPublicKeyFingerprints: [Long.fromString('c3b42b026ce86b21', false, 16)],
            }

            const r = new TlBinaryReader(map, hexDecodeToBuffer(input))
            expect(r.long().toString()).toEqual('0') // authKeyId
            expect(r.long().toString(16)).toEqual('51E57AC91E83C801'.toLowerCase()) // messageId
            expect(r.uint()).toEqual(64) // messageLength

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const obj = r.object() as any
            expect(obj._).toEqual('mt_resPQ')
            expect(hexEncode(obj.nonce)).toEqual(hexEncode(expected.nonce))
            expect(hexEncode(obj.serverNonce)).toEqual(hexEncode(expected.serverNonce))
            expect(hexEncode(obj.pq)).toEqual(hexEncode(expected.pq))
            expect(obj.serverPublicKeyFingerprints.length).toEqual(1)
            expect(obj.serverPublicKeyFingerprints[0].toString(16)).toEqual(
                expected.serverPublicKeyFingerprints[0].toString(16),
            )
        })
    })
})
