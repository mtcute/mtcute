import { describe, it } from 'mocha'
import { expect } from 'chai'

import { IntermediatePacketCodec, TransportError } from '../../src'

describe('IntermediatePacketCodec', () => {
    it('should return correct tag', () => {
        expect(new IntermediatePacketCodec().tag().toString('hex')).eq(
            'eeeeeeee'
        )
    })

    it('should correctly parse immediate framing', (done) => {
        const codec = new IntermediatePacketCodec()
        codec.on('packet', (data) => {
            expect([...data]).eql([5, 1, 2, 3, 4])
            done()
        })
        codec.feed(Buffer.from('050000000501020304', 'hex'))
    })

    it('should correctly parse incomplete framing', (done) => {
        const codec = new IntermediatePacketCodec()
        codec.on('packet', (data) => {
            expect([...data]).eql([5, 1, 2, 3, 4])
            done()
        })
        codec.feed(Buffer.from('050000000501', 'hex'))
        codec.feed(Buffer.from('020304', 'hex'))
    })

    it('should correctly parse multiple streamed packets', (done) => {
        const codec = new IntermediatePacketCodec()

        let number = 0

        codec.on('packet', (data) => {
            if (number === 0) {
                expect([...data]).eql([5, 1, 2, 3, 4])
                number = 1
            } else {
                expect([...data]).eql([3, 1, 2, 3, 1])
                done()
            }
        })
        codec.feed(Buffer.from('050000000501', 'hex'))
        codec.feed(Buffer.from('020304050000', 'hex'))
        codec.feed(Buffer.from('000301020301', 'hex'))
    })

    it('should correctly parse transport errors', (done) => {
        const codec = new IntermediatePacketCodec()

        codec.on('error', (err) => {
            expect(err).to.have.instanceOf(TransportError)
            expect(err.code).eq(404)
            done()
        })

        codec.feed(Buffer.from('040000006cfeffff', 'hex'))
    })

    it('should reset when called reset()', (done) => {
        const codec = new IntermediatePacketCodec()

        codec.on('packet', (data) => {
            expect([...data]).eql([1, 2, 3, 4, 5])
            done()
        })

        codec.feed(Buffer.from('ff0000001234567812345678', 'hex'))
        codec.reset()
        codec.feed(Buffer.from('050000000102030405', 'hex'))
    })
})
