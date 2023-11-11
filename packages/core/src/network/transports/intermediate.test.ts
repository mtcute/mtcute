import { describe, expect, it } from 'vitest'

import { hexDecodeToBuffer, hexEncode } from '@mtcute/tl-runtime'

import { IntermediatePacketCodec, PaddedIntermediatePacketCodec, TransportError } from '../../index.js'
import { concatBuffers, dataViewFromBuffer } from '../../utils/index.js'

describe('IntermediatePacketCodec', () => {
    it('should return correct tag', () => {
        expect(hexEncode(new IntermediatePacketCodec().tag())).eq('eeeeeeee')
    })

    it('should correctly parse immediate framing', () =>
        new Promise<void>((done) => {
            const codec = new IntermediatePacketCodec()
            codec.on('packet', (data: Uint8Array) => {
                expect([...data]).eql([5, 1, 2, 3, 4])
                done()
            })
            codec.feed(hexDecodeToBuffer('050000000501020304'))
        }))

    it('should correctly parse incomplete framing', () =>
        new Promise<void>((done) => {
            const codec = new IntermediatePacketCodec()
            codec.on('packet', (data: Uint8Array) => {
                expect([...data]).eql([5, 1, 2, 3, 4])
                done()
            })
            codec.feed(hexDecodeToBuffer('050000000501'))
            codec.feed(hexDecodeToBuffer('020304'))
        }))

    it('should correctly parse multiple streamed packets', () =>
        new Promise<void>((done) => {
            const codec = new IntermediatePacketCodec()

            let number = 0

            codec.on('packet', (data: Uint8Array) => {
                if (number === 0) {
                    expect([...data]).eql([5, 1, 2, 3, 4])
                    number = 1
                } else {
                    expect([...data]).eql([3, 1, 2, 3, 1])
                    done()
                }
            })
            codec.feed(hexDecodeToBuffer('050000000501'))
            codec.feed(hexDecodeToBuffer('020304050000'))
            codec.feed(hexDecodeToBuffer('000301020301'))
        }))

    it('should correctly parse transport errors', () =>
        new Promise<void>((done) => {
            const codec = new IntermediatePacketCodec()

            codec.on('error', (err: TransportError) => {
                expect(err).to.have.instanceOf(TransportError)
                expect(err.code).eq(404)
                done()
            })

            codec.feed(hexDecodeToBuffer('040000006cfeffff'))
        }))

    it('should reset when called reset()', () =>
        new Promise<void>((done) => {
            const codec = new IntermediatePacketCodec()

            codec.on('packet', (data: Uint8Array) => {
                expect([...data]).eql([1, 2, 3, 4, 5])
                done()
            })

            codec.feed(hexDecodeToBuffer('ff0000001234567812345678'))
            codec.reset()
            codec.feed(hexDecodeToBuffer('050000000102030405'))
        }))

    it('should correctly frame packets', () => {
        const data = hexDecodeToBuffer('6cfeffff')

        // eslint-disable-next-line no-restricted-globals
        expect(Buffer.from(new IntermediatePacketCodec().encode(data))).toEqual(
            concatBuffers([new Uint8Array([0x04, 0x00, 0x00, 0x00]), data]),
        )
    })
})

describe('PaddedIntermediatePacketCodec', () => {
    it('should return correct tag', () => {
        expect(hexEncode(new PaddedIntermediatePacketCodec().tag())).eq('dddddddd')
    })

    it('should correctly frame packets', () => {
        // todo: once we have predictable random, test this properly

        const data = hexDecodeToBuffer('6cfeffff')
        const encoded = new PaddedIntermediatePacketCodec().encode(data)
        const dv = dataViewFromBuffer(encoded)

        const packetSize = dv.getUint32(0, true)
        const paddingSize = packetSize - data.length

        // padding size, 0-15
        expect(paddingSize).toBeGreaterThanOrEqual(0)
        expect(paddingSize).toBeLessThanOrEqual(15)
        expect([...encoded.slice(4, 4 + packetSize - paddingSize)]).toEqual([...data])
    })
})
