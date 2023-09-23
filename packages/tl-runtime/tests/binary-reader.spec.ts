// eslint-disable-next-line max-len
/* eslint-disable @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-return */
import { expect } from 'chai'
import { randomBytes } from 'crypto'
import Long from 'long'
import { describe, it } from 'mocha'

import { TlBinaryReader, TlReaderMap } from '../src'

describe('TlBinaryReader', () => {
    it('should read int32', () => {
        expect(TlBinaryReader.manual(Buffer.from([0, 0, 0, 0])).int()).eq(0)
        expect(TlBinaryReader.manual(Buffer.from([1, 0, 0, 0])).int()).eq(1)
        expect(TlBinaryReader.manual(Buffer.from([1, 2, 3, 4])).int()).eq(67305985)
        expect(new TlBinaryReader({}, Buffer.from([0xff, 0xff, 0xff, 0xff])).int()).eq(-1)
    })

    it('should read uint32', () => {
        expect(TlBinaryReader.manual(Buffer.from([0, 0, 0, 0])).uint()).eq(0)
        expect(TlBinaryReader.manual(Buffer.from([1, 0, 0, 0])).uint()).eq(1)
        expect(TlBinaryReader.manual(Buffer.from([1, 2, 3, 4])).uint()).eq(67305985)
        expect(new TlBinaryReader({}, Buffer.from([0xff, 0xff, 0xff, 0xff])).uint()).eq(4294967295)
    })

    it('should read int53', () => {
        expect(TlBinaryReader.manual(Buffer.from([0, 0, 0, 0, 0, 0, 0, 0])).int53()).eq(0)
        expect(TlBinaryReader.manual(Buffer.from([1, 0, 0, 0, 0, 0, 0, 0])).int53()).eq(1)
        expect(TlBinaryReader.manual(Buffer.from([1, 2, 3, 4, 0, 0, 0, 0])).int53()).eq(67305985)
        expect(TlBinaryReader.manual(Buffer.from([1, 0, 1, 0, 1, 0, 1, 0])).int53()).eq(281479271743489)
        expect(new TlBinaryReader({}, Buffer.from([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff])).int53()).eq(-1)
    })

    it('should read long', () => {
        expect(
            new TlBinaryReader({}, Buffer.from([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff])).long().toString(),
        ).eq('-1')
        expect(
            new TlBinaryReader({}, Buffer.from([0x12, 0x34, 0x56, 0x78, 0x12, 0x34, 0x56, 0x78])).long().toString(),
        ).eq('8671175386481439762')
        expect(
            new TlBinaryReader({}, Buffer.from([0x15, 0xc4, 0x15, 0xb5, 0xc4, 0x1c, 0x03, 0xa3])).long().toString(),
        ).eq('-6700480189419895787')
    })

    it('should read float', () => {
        expect(TlBinaryReader.manual(Buffer.from([0, 0, 0x80, 0x3f])).float()).closeTo(1, 0.001)
        expect(new TlBinaryReader({}, Buffer.from([0xb6, 0xf3, 0x9d, 0x3f])).float()).closeTo(1.234, 0.001)
        expect(new TlBinaryReader({}, Buffer.from([0xfa, 0x7e, 0x2a, 0x3f])).float()).closeTo(0.666, 0.001)
    })

    it('should read double', () => {
        expect(new TlBinaryReader({}, Buffer.from([0, 0, 0, 0, 0, 0, 0xf0, 0x3f])).double()).closeTo(1, 0.001)
        expect(new TlBinaryReader({}, Buffer.from([0, 0, 0, 0, 0, 0, 0x25, 0x40])).double()).closeTo(10.5, 0.001)
        expect(new TlBinaryReader({}, Buffer.from([0x9a, 0x99, 0x99, 0x99, 0x99, 0x99, 0x21, 0x40])).double()).closeTo(
            8.8,
            0.001,
        )
    })

    it('should read raw bytes', () => {
        expect([...TlBinaryReader.manual(Buffer.from([1, 2, 3, 4])).raw(2)]).eql([1, 2])
        expect([...TlBinaryReader.manual(Buffer.from([1, 2, 3, 4])).raw()]).eql([1, 2, 3, 4])
        expect([...TlBinaryReader.manual(Buffer.from([1, 2, 3, 4])).raw(0)]).eql([])
    })

    it('should move cursor', () => {
        const reader = new TlBinaryReader({}, Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]))

        reader.int()
        expect(reader.pos).eq(4)
        reader.seek(-4)
        expect(reader.pos).eq(0)

        expect(() => reader.seek(-1)).to.throw(RangeError)
        expect(() => reader.seek(1000)).to.throw(RangeError)

        reader.uint()
        expect(reader.pos).eq(4)
        reader.seekTo(0)
        expect(reader.pos).eq(0)

        expect(() => reader.seekTo(-1)).to.throw(RangeError)
        expect(() => reader.seekTo(1000)).to.throw(RangeError)

        const checkFunction = (fn: () => void, sz: number) => {
            fn()
            expect(reader.pos).eq(sz)
            reader.seekTo(0)
        }

        checkFunction(() => reader.long(), 8)
        checkFunction(() => reader.float(), 4)
        checkFunction(() => reader.double(), 8)
        checkFunction(() => reader.raw(5), 5)
    })

    it('should read tg-encoded bytes', () => {
        expect([...TlBinaryReader.manual(Buffer.from([1, 2, 3, 4])).bytes()]).eql([2])

        const random250bytes = randomBytes(250)
        let reader = new TlBinaryReader({}, Buffer.from([250, ...random250bytes, 0, 0, 0, 0, 0]))
        expect([...reader.bytes()]).eql([...random250bytes])
        expect(reader.pos).eq(252)

        const random1000bytes = randomBytes(1000)
        const buffer = Buffer.alloc(1010)
        buffer[0] = 254
        buffer.writeIntLE(1000, 1, 3)
        buffer.set(random1000bytes, 4)
        reader = TlBinaryReader.manual(buffer)
        expect([...reader.bytes()]).eql([...random1000bytes])
        expect(reader.pos).eq(1004)
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
        const buffer = Buffer.from([
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
        expect(deadBeef).eql({ a: 1, b: 42 })
        const baadCode = reader.object()
        expect(baadCode).eq(2)
    })

    it('should read tg-encoded vectors', () => {
        const buffer = Buffer.from([
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
        expect(vector).eql([{ a: 1, b: 42 }, 2, { vec: [1, 2] }])

        reader.seekTo(0)
        const vectorObj = reader.object()
        expect(vector).eql(vectorObj)
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
                nonce: Buffer.from('3E0549828CCA27E966B301A48FECE2FC', 'hex'),
                serverNonce: Buffer.from('A5CF4D33F4A11EA877BA4AA573907330', 'hex'),
                pq: Buffer.from('17ED48941A08F981', 'hex'),
                serverPublicKeyFingerprints: [Long.fromString('c3b42b026ce86b21', false, 16)],
            }

            const r = new TlBinaryReader(map, Buffer.from(input, 'hex'))
            expect(r.long().toString()).eq('0') // authKeyId
            expect(r.long().toString(16)).eq('51E57AC91E83C801'.toLowerCase()) // messageId
            expect(r.uint()).eq(64) // messageLength

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const obj = r.object() as any
            expect(obj._).eq('mt_resPQ')
            expect(obj.nonce.toString('hex')).eq(expected.nonce.toString('hex'))
            expect(obj.serverNonce.toString('hex')).eq(expected.serverNonce.toString('hex'))
            expect(obj.pq.toString('hex')).eq(expected.pq.toString('hex'))
            expect(obj.serverPublicKeyFingerprints.length).eq(1)
            expect(obj.serverPublicKeyFingerprints[0].toString(16)).eq(
                expected.serverPublicKeyFingerprints[0].toString(16),
            )
        })
    })
})
