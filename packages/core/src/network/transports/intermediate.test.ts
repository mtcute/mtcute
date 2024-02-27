import { describe, expect, it } from 'vitest'

import { defaultTestCryptoProvider, useFakeMathRandom } from '@mtcute/test'

import { IntermediatePacketCodec, PaddedIntermediatePacketCodec, TransportError } from '../../index.js'
import { getPlatform } from '../../platform.js'

const p = getPlatform()

describe('IntermediatePacketCodec', () => {
    it('should return correct tag', () => {
        expect(p.hexEncode(new IntermediatePacketCodec().tag())).eq('eeeeeeee')
    })

    it('should correctly parse immediate framing', () =>
        new Promise<void>((done) => {
            const codec = new IntermediatePacketCodec()
            codec.on('packet', (data: Uint8Array) => {
                expect([...data]).eql([5, 1, 2, 3, 4])
                done()
            })
            codec.feed(p.hexDecode('050000000501020304'))
        }))

    it('should correctly parse incomplete framing', () =>
        new Promise<void>((done) => {
            const codec = new IntermediatePacketCodec()
            codec.on('packet', (data: Uint8Array) => {
                expect([...data]).eql([5, 1, 2, 3, 4])
                done()
            })
            codec.feed(p.hexDecode('050000000501'))
            codec.feed(p.hexDecode('020304'))
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
            codec.feed(p.hexDecode('050000000501'))
            codec.feed(p.hexDecode('020304050000'))
            codec.feed(p.hexDecode('000301020301'))
        }))

    it('should correctly parse transport errors', () =>
        new Promise<void>((done) => {
            const codec = new IntermediatePacketCodec()

            codec.on('error', (err: TransportError) => {
                expect(err).to.have.instanceOf(TransportError)
                expect(err.code).eq(404)
                done()
            })

            codec.feed(p.hexDecode('040000006cfeffff'))
        }))

    it('should reset when called reset()', () =>
        new Promise<void>((done) => {
            const codec = new IntermediatePacketCodec()

            codec.on('packet', (data: Uint8Array) => {
                expect([...data]).eql([1, 2, 3, 4, 5])
                done()
            })

            codec.feed(p.hexDecode('ff0000001234567812345678'))
            codec.reset()
            codec.feed(p.hexDecode('050000000102030405'))
        }))

    it('should correctly frame packets', () => {
        const data = p.hexDecode('6cfeffff')

        expect(p.hexEncode(new IntermediatePacketCodec().encode(data))).toEqual('040000006cfeffff')
    })
})

describe('PaddedIntermediatePacketCodec', () => {
    useFakeMathRandom()

    const create = async () => {
        const codec = new PaddedIntermediatePacketCodec()
        codec.setup!(await defaultTestCryptoProvider())

        return codec
    }

    it('should return correct tag', async () => {
        expect(p.hexEncode((await create()).tag())).eq('dddddddd')
    })

    it('should correctly frame packets', async () => {
        const data = p.hexDecode('6cfeffff')

        expect(p.hexEncode((await create()).encode(data))).toEqual('0a0000006cfeffff29afd26df40f')
    })
})
