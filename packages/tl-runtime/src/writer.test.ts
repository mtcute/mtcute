/* eslint-disable @typescript-eslint/no-unsafe-call */
import Long from 'long'
import { describe, expect, it } from 'vitest'

import { hexDecodeToBuffer, hexEncode } from '../src/encodings/hex.js'
import { TlBinaryWriter, TlSerializationCounter, TlWriterMap } from './writer.js'

let randomBytes: (n: number) => Uint8Array

if (import.meta.env.TEST_ENV === 'node' || import.meta.env.TEST_ENV === 'bun') {
    randomBytes = await import('crypto').then((m) => m.randomBytes)
} else {
    randomBytes = (n: number) => {
        const buf = new Uint8Array(n)
        crypto.getRandomValues(buf)

        return buf
    }
}

describe('TlBinaryWriter', () => {
    const testSingleMethod = (size: number, fn: (w: TlBinaryWriter) => void, map?: TlWriterMap): string => {
        const w = TlBinaryWriter.alloc(map, size)
        fn(w)
        expect(w.pos).toEqual(size)

        return hexEncode(w.uint8View)
    }

    it('should write int32', () => {
        expect(testSingleMethod(4, (w) => w.int(0))).toEqual('00000000')
        expect(testSingleMethod(4, (w) => w.int(1))).toEqual('01000000')
        expect(testSingleMethod(4, (w) => w.int(67305985))).toEqual('01020304')
        expect(testSingleMethod(4, (w) => w.int(-1))).toEqual('ffffffff')
    })

    it('should write uint32', () => {
        expect(testSingleMethod(4, (w) => w.uint(0))).toEqual('00000000')
        expect(testSingleMethod(4, (w) => w.uint(1))).toEqual('01000000')
        expect(testSingleMethod(4, (w) => w.uint(67305985))).toEqual('01020304')
        expect(testSingleMethod(4, (w) => w.uint(4294967295))).toEqual('ffffffff')
    })

    it('should write int53', () => {
        expect(testSingleMethod(8, (w) => w.int53(0))).toEqual('0000000000000000')
        expect(testSingleMethod(8, (w) => w.int53(1))).toEqual('0100000000000000')
        expect(testSingleMethod(8, (w) => w.int53(67305985))).toEqual('0102030400000000')
        expect(testSingleMethod(8, (w) => w.int53(281479271743489))).toEqual('0100010001000100')
        expect(testSingleMethod(8, (w) => w.int53(-1))).toEqual('ffffffffffffffff')
    })

    it('should write long', () => {
        expect(testSingleMethod(8, (w) => w.long(Long.NEG_ONE))).toEqual('ffffffffffffffff')
        expect(testSingleMethod(8, (w) => w.long(Long.fromString('8671175386481439762')))).toEqual('1234567812345678')
        expect(testSingleMethod(8, (w) => w.long(Long.fromString('-6700480189419895787')))).toEqual('15c415b5c41c03a3')
    })

    it('should write float', () => {
        expect(testSingleMethod(4, (w) => w.float(1))).toEqual('0000803f')
        expect(testSingleMethod(4, (w) => w.float(1.234))).toEqual('b6f39d3f')
        expect(testSingleMethod(4, (w) => w.float(0.666))).toEqual('fa7e2a3f')
    })

    it('should write double', () => {
        expect(testSingleMethod(8, (w) => w.double(1))).toEqual('000000000000f03f')
        expect(testSingleMethod(8, (w) => w.double(10.5))).toEqual('0000000000002540')
        expect(testSingleMethod(8, (w) => w.double(8.8))).toEqual('9a99999999992140')
    })

    it('should write raw bytes', () => {
        expect(testSingleMethod(5, (w) => w.raw(new Uint8Array([4, 3, 5, 1, 1])))).toEqual('0403050101')
    })

    it('should write tg-encoded boolean', () => {
        expect(testSingleMethod(4, (w) => w.boolean(false))).toEqual('379779bc')
        expect(testSingleMethod(4, (w) => w.boolean(true))).toEqual('b5757299')
    })

    it('should write tg-encoded bytes', () => {
        expect(testSingleMethod(4, (w) => w.bytes(new Uint8Array([1, 2, 3])))).toEqual('03010203')
        expect(testSingleMethod(8, (w) => w.bytes(new Uint8Array([1, 2, 3, 4])))).toEqual('0401020304000000')

        const random250bytes = randomBytes(250)
        expect(testSingleMethod(252, (w) => w.bytes(random250bytes))).toEqual(`fa${hexEncode(random250bytes)}00`)

        const random1000bytes = randomBytes(1000)
        const buffer = new Uint8Array(1004)
        buffer[0] = 254
        new DataView(buffer.buffer).setUint32(1, 1000, true)
        buffer.set(random1000bytes, 4)
        expect(testSingleMethod(1004, (w) => w.bytes(random1000bytes))).toEqual(hexEncode(buffer))
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
        // eslint-disable-next-line
        _staticSize: {} as any,
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
        expect(length).toEqual(20)

        expect(
            testSingleMethod(
                length,
                (w) => {
                    w.object(object1)
                    w.object(object2)
                },
                stubObjectsMap,
            ),
        ).toEqual('efbeadde01000000addecefadec0adba02000000')
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
        expect(length).toEqual(48)

        expect(
            testSingleMethod(
                length,
                (w) => {
                    w.vector(w.object, [object1, object2, object3])
                },
                stubObjectsMap,
            ),
        ).toEqual('15c4b51c03000000efbeadde01000000addecefadec0adba020000003d0cbfbe15c4b51c020000000100000002000000')
    })

    describe('examples from documentation', () => {
        // https://core.telegram.org/mtproto/samples-auth_key#2-a-response-from-the-server-has-been-received-with-the-following-content
        it('should be able to write resPQ', () => {
            const expected =
                '000000000000000001c8831ec97ae55140000000632416053e0549828cca27e966b301a48fece2fca5cf4d33f4a11ea877ba4aa5739073300817ed48941a08f98100000015c4b51c01000000216be86c022bb4c3'

            const resPq = {
                _: 'mt_resPQ',
                nonce: hexDecodeToBuffer('3E0549828CCA27E966B301A48FECE2FC'),
                serverNonce: hexDecodeToBuffer('A5CF4D33F4A11EA877BA4AA573907330'),
                pq: hexDecodeToBuffer('17ED48941A08F981'),
                serverPublicKeyFingerprints: [Long.fromString('c3b42b026ce86b21', 16)],
            }

            const map: TlWriterMap = {
                mt_resPQ: function (w, obj) {
                    w.uint(85337187)
                    w.int128(obj.nonce)
                    w.int128(obj.serverNonce)
                    w.bytes(obj.pq)
                    w.vector(w.long, obj.serverPublicKeyFingerprints)
                },
                // eslint-disable-next-line
                _staticSize: {} as any,
            }

            const length =
                20 + // mtproto header
                TlSerializationCounter.countNeededBytes(map, resPq)

            expect(length).toEqual(expected.length / 2)
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
            ).toEqual(expected)
        })
    })
})
