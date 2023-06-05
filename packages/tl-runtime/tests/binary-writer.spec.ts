import { expect } from 'chai'
import { randomBytes } from 'crypto'
import Long from 'long'
import { describe, it } from 'mocha'

import { TlBinaryWriter, TlSerializationCounter, TlWriterMap } from '../src'

describe('TlBinaryWriter', () => {
    const testSingleMethod = (
        size: number,
        fn: (w: TlBinaryWriter) => void,
        map: TlWriterMap = {},
    ): string => {
        const w = TlBinaryWriter.alloc(map, size)
        fn(w)
        expect(w.pos).eq(size)

        return w.buffer.toString('hex')
    }

    it('should write int32', () => {
        expect(testSingleMethod(4, (w) => w.int(0))).eq('00000000')
        expect(testSingleMethod(4, (w) => w.int(1))).eq('01000000')
        expect(testSingleMethod(4, (w) => w.int(67305985))).eq('01020304')
        expect(testSingleMethod(4, (w) => w.int(-1))).eq('ffffffff')
    })

    it('should write uint32', () => {
        expect(testSingleMethod(4, (w) => w.uint(0))).eq('00000000')
        expect(testSingleMethod(4, (w) => w.uint(1))).eq('01000000')
        expect(testSingleMethod(4, (w) => w.uint(67305985))).eq('01020304')
        expect(testSingleMethod(4, (w) => w.uint(4294967295))).eq('ffffffff')
    })

    it('should write int53', () => {
        expect(testSingleMethod(8, (w) => w.int53(0))).eq('0000000000000000')
        expect(testSingleMethod(8, (w) => w.int53(1))).eq('0100000000000000')
        expect(testSingleMethod(8, (w) => w.int53(67305985))).eq(
            '0102030400000000',
        )
        expect(testSingleMethod(8, (w) => w.int53(281479271743489))).eq(
            '0100010001000100',
        )
        expect(testSingleMethod(8, (w) => w.int53(-1))).eq('ffffffffffffffff')
    })

    it('should write long', () => {
        expect(testSingleMethod(8, (w) => w.long(Long.NEG_ONE))).eq(
            'ffffffffffffffff',
        )
        expect(
            testSingleMethod(8, (w) =>
                w.long(Long.fromString('8671175386481439762')),
            ),
        ).eq('1234567812345678')
        expect(
            testSingleMethod(8, (w) =>
                w.long(Long.fromString('-6700480189419895787')),
            ),
        ).eq('15c415b5c41c03a3')
    })

    it('should write float', () => {
        expect(testSingleMethod(4, (w) => w.float(1))).eq('0000803f')
        expect(testSingleMethod(4, (w) => w.float(1.234))).eq('b6f39d3f')
        expect(testSingleMethod(4, (w) => w.float(0.666))).eq('fa7e2a3f')
    })

    it('should write double', () => {
        expect(testSingleMethod(8, (w) => w.double(1))).eq('000000000000f03f')
        expect(testSingleMethod(8, (w) => w.double(10.5))).eq(
            '0000000000002540',
        )
        expect(testSingleMethod(8, (w) => w.double(8.8))).eq('9a99999999992140')
    })

    it('should write raw bytes', () => {
        expect(
            testSingleMethod(5, (w) => w.raw(Buffer.from([4, 3, 5, 1, 1]))),
        ).eq('0403050101')
    })

    it('should write tg-encoded boolean', () => {
        expect(testSingleMethod(4, (w) => w.boolean(false))).eq('379779bc')
        expect(testSingleMethod(4, (w) => w.boolean(true))).eq('b5757299')
    })

    it('should write tg-encoded bytes', () => {
        expect(testSingleMethod(4, (w) => w.bytes(Buffer.from([1, 2, 3])))).eq(
            '03010203',
        )
        expect(
            testSingleMethod(8, (w) => w.bytes(Buffer.from([1, 2, 3, 4]))),
        ).eq('0401020304000000')

        const random250bytes = randomBytes(250)
        expect(testSingleMethod(252, (w) => w.bytes(random250bytes))).eq(
            'fa' + random250bytes.toString('hex') + '00',
        )

        const random1000bytes = randomBytes(1000)
        const buffer = Buffer.alloc(1004)
        buffer[0] = 254
        buffer.writeIntLE(1000, 1, 3)
        buffer.set(random1000bytes, 4)
        expect(testSingleMethod(1004, (w) => w.bytes(random1000bytes))).eq(
            buffer.toString('hex'),
        )
    })

    const stubObjectsMap: TlWriterMap = {
        deadbeef: function (w, obj) {
            w.uint(0xdeadbeef)
            w.int(obj.a)
            w.object(obj.b)
        },
        facedead: function (w) {
            w.uint(0xfacedead)
        },
        baadc0de: function (w, obj) {
            w.uint(0xbaadc0de)
            w.uint(obj.n)
        },
        bebf0c3d: function (w, obj) {
            w.uint(0xbebf0c3d)
            w.vector(w.int, obj.vec)
        },
    }

    it('should write tg-encoded objects', () => {
        const object1 = {
            _: 'deadbeef',
            a: 1,
            b: { _: 'facedead' },
        }
        const object2 = {
            _: 'baadc0de',
            n: 2,
        }

        const length =
            TlSerializationCounter.countNeededBytes(stubObjectsMap, object1) +
            TlSerializationCounter.countNeededBytes(stubObjectsMap, object2)
        expect(length).eq(20)

        expect(
            testSingleMethod(
                length,
                (w) => {
                    w.object(object1)
                    w.object(object2)
                },
                stubObjectsMap,
            ),
        ).eq('efbeadde01000000addecefadec0adba02000000')
    })

    it('should write tg-encoded vectors', () => {
        const object1 = {
            _: 'deadbeef',
            a: 1,
            b: { _: 'facedead' },
        }
        const object2 = {
            _: 'baadc0de',
            n: 2,
        }
        const object3 = {
            _: 'bebf0c3d',
            vec: [1, 2],
        }

        const length =
            TlSerializationCounter.countNeededBytes(stubObjectsMap, object1) +
            TlSerializationCounter.countNeededBytes(stubObjectsMap, object2) +
            TlSerializationCounter.countNeededBytes(stubObjectsMap, object3) +
            8 // because technically in tl vector can't be top-level, but whatever :shrug:
        expect(length).eq(48)

        expect(
            testSingleMethod(
                length,
                (w) => {
                    w.vector(w.object, [object1, object2, object3])
                },
                stubObjectsMap,
            ),
        ).eq(
            '15c4b51c03000000efbeadde01000000addecefadec0adba020000003d0cbfbe15c4b51c020000000100000002000000',
        )
    })

    describe('examples from documentation', () => {
        // https://core.telegram.org/mtproto/samples-auth_key#2-a-response-from-the-server-has-been-received-with-the-following-content
        it('should be able to write resPQ', () => {
            const expected =
                '000000000000000001c8831ec97ae55140000000632416053e0549828cca27e966b301a48fece2fca5cf4d33f4a11ea877ba4aa5739073300817ed48941a08f98100000015c4b51c01000000216be86c022bb4c3'

            const resPq = {
                _: 'mt_resPQ',
                nonce: Buffer.from('3E0549828CCA27E966B301A48FECE2FC', 'hex'),
                serverNonce: Buffer.from(
                    'A5CF4D33F4A11EA877BA4AA573907330',
                    'hex',
                ),
                pq: Buffer.from('17ED48941A08F981', 'hex'),
                serverPublicKeyFingerprints: [
                    Long.fromString('c3b42b026ce86b21', 16),
                ],
            }

            const map: TlWriterMap = {
                mt_resPQ: function (w, obj) {
                    w.uint(85337187)
                    w.int128(obj.nonce)
                    w.int128(obj.serverNonce)
                    w.bytes(obj.pq)
                    w.vector(w.long, obj.serverPublicKeyFingerprints)
                },
            }

            const length =
                20 + // mtproto header
                TlSerializationCounter.countNeededBytes(map, resPq)

            expect(length).eq(expected.length / 2)
            expect(
                testSingleMethod(
                    length,
                    (w) => {
                        w.long(Long.ZERO) // authKeyId
                        w.long(Long.fromString('51E57AC91E83C801', true, 16)) // messageId
                        w.uint(64) // messageLength

                        w.object(resPq)
                    },
                    map,
                ),
            ).eq(expected)
        })
    })
})
