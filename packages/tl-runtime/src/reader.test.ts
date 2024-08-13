/* eslint-disable ts/no-unsafe-call,ts/no-unsafe-assignment,ts/no-unsafe-return,ts/no-unsafe-argument */

// import Long from 'long'
import Long from 'long'
import { describe, expect, it } from 'vitest'

import type { TlReaderMap } from './reader.js'
import { TlBinaryReader } from './reader.js'

// todo: replace with platform-specific packages
const hexEncode = (buf: Uint8Array) => buf.reduce((acc, val) => acc + val.toString(16).padStart(2, '0'), '')
const hexDecodeToBuffer = (hex: string) => new Uint8Array(hex.match(/.{1,2}/g)!.map(byte => Number.parseInt(byte, 16)))

let randomBytes: (n: number) => Uint8Array

if (import.meta.env.TEST_ENV === 'node' || import.meta.env.TEST_ENV === 'bun') {
    randomBytes = await import('node:crypto').then(m => m.randomBytes)
} else {
    randomBytes = (n: number) => {
        const buf = new Uint8Array(n)
        crypto.getRandomValues(buf)

        return buf
    }
}

describe('TlBinaryReader', () => {
    it('should read int32', () => {
        expect(TlBinaryReader.manual(new Uint8Array([0, 0, 0, 0])).int()).toEqual(0)
        expect(TlBinaryReader.manual(new Uint8Array([1, 0, 0, 0])).int()).toEqual(1)
        expect(TlBinaryReader.manual(new Uint8Array([1, 2, 3, 4])).int()).toEqual(67305985)
        expect(TlBinaryReader.manual(new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF])).int()).toEqual(-1)
    })

    it('should read uint32', () => {
        expect(TlBinaryReader.manual(new Uint8Array([0, 0, 0, 0])).uint()).toEqual(0)
        expect(TlBinaryReader.manual(new Uint8Array([1, 0, 0, 0])).uint()).toEqual(1)
        expect(TlBinaryReader.manual(new Uint8Array([1, 2, 3, 4])).uint()).toEqual(67305985)
        expect(TlBinaryReader.manual(new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF])).uint()).toEqual(
            4294967295,
        )
    })

    it('should read int53', () => {
        expect(TlBinaryReader.manual(new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0])).int53()).toEqual(0)
        expect(TlBinaryReader.manual(new Uint8Array([1, 0, 0, 0, 0, 0, 0, 0])).int53()).toEqual(1)
        expect(TlBinaryReader.manual(new Uint8Array([1, 2, 3, 4, 0, 0, 0, 0])).int53()).toEqual(
            67305985,
        )
        expect(TlBinaryReader.manual(new Uint8Array([1, 0, 1, 0, 1, 0, 1, 0])).int53()).toEqual(
            281479271743489,
        )
        expect(
            TlBinaryReader.manual(
                new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]),
            ).int53(),
        ).toEqual(-1)
    })

    it('should read long', () => {
        expect(
            TlBinaryReader.manual(new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]))
                .long()
                .toString(),
        ).toEqual('-1')
        expect(
            TlBinaryReader.manual(new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x12, 0x34, 0x56, 0x78]))
                .long()
                .toString(),
        ).toEqual('8671175386481439762')
        expect(
            TlBinaryReader.manual(new Uint8Array([0x15, 0xC4, 0x15, 0xB5, 0xC4, 0x1C, 0x03, 0xA3]))
                .long()
                .toString(),
        ).toEqual('-6700480189419895787')
    })

    it('should read float', () => {
        expect(TlBinaryReader.manual(new Uint8Array([0, 0, 0x80, 0x3F])).float()).toBeCloseTo(
            1,
            0.001,
        )
        expect(TlBinaryReader.manual(new Uint8Array([0xB6, 0xF3, 0x9D, 0x3F])).float()).toBeCloseTo(
            1.234,
            0.001,
        )
        expect(TlBinaryReader.manual(new Uint8Array([0xFA, 0x7E, 0x2A, 0x3F])).float()).toBeCloseTo(
            0.666,
            0.001,
        )
    })

    it('should read double', () => {
        expect(
            TlBinaryReader.manual(new Uint8Array([0, 0, 0, 0, 0, 0, 0xF0, 0x3F])).double(),
        ).toBeCloseTo(1, 0.001)
        expect(
            TlBinaryReader.manual(new Uint8Array([0, 0, 0, 0, 0, 0, 0x25, 0x40])).double(),
        ).toBeCloseTo(10.5, 0.001)
        expect(
            TlBinaryReader.manual(
                new Uint8Array([0x9A, 0x99, 0x99, 0x99, 0x99, 0x99, 0x21, 0x40]),
            ).double(),
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
        const buffer = new Uint8Array(1010)
        buffer[0] = 254
        new DataView(buffer.buffer).setUint32(1, 1000, true)
        buffer.set(random1000bytes, 4)
        reader = TlBinaryReader.manual(buffer)
        expect([...reader.bytes()]).toEqual([...random1000bytes])
        expect(reader.pos).toEqual(1004)
    })

    const stubObjectsMap: TlReaderMap = {
        3735928559(r) {
            return { a: r.int(), b: r.object() }
        },
        3131949278(r) {
            return r.uint()
        },
        4207861421: () => 42,
        3200191549(r) {
            return { vec: r.vector(r.uint) }
        },
    }

    it('should read tg-encoded objects', () => {
        const buffer = new Uint8Array([
            0xEF,
            0xBE,
            0xAD,
            0xDE, // 0xdeadbeef object
            /**/ 0x01,
            0x00,
            0x00,
            0x00, // a = int32 1
            /**/ 0xAD,
            0xDE,
            0xCE,
            0xFA, // b = 0xfacedead object (aka constant 42)

            0xDE,
            0xC0,
            0xAD,
            0xBA, // 0xbaadc0de object
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
            0xC4,
            0xB5,
            0x1C, // 0x1cb5c415 object (vector)
            /**/ 0x03,
            0x00,
            0x00,
            0x00, // vector size (3)

            /**/ 0xEF,
            0xBE,
            0xAD,
            0xDE, // 0xdeadbeef object
            /****/ 0x01,
            0x00,
            0x00,
            0x00, // a = int32 1
            /****/ 0xAD,
            0xDE,
            0xCE,
            0xFA, // 0xfacedead object (aka constant 42)

            /**/ 0xDE,
            0xC0,
            0xAD,
            0xBA, // 0xbaadc0de object
            /****/ 0x02,
            0x00,
            0x00,
            0x00, // int32 2

            /**/ 0x3D,
            0x0C,
            0xBF,
            0xBE, // 0xbebf0c3d object
            /****/ 0x15,
            0xC4,
            0xB5,
            0x1C, // 0x1cb5c415 object (vector)
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
            const input
                = '000000000000000001c8831ec97ae55140000000632416053e0549828cca27e966b301a48fece2fca5cf4d33f4a11ea877ba4aa5739073300817ed48941a08f98100000015c4b51c01000000216be86c022bb4c3'
            const map: TlReaderMap = {
                85337187(r) {
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
