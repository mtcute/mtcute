/* eslint-disable no-restricted-globals,@typescript-eslint/no-unsafe-assignment */
// for whatever reason eslint doesn't properly handle chai-spies typings
import chai, { expect } from 'chai'
import spies from 'chai-spies'
import { describe, it } from 'mocha'

import {
    createAesIgeForMessage,
    createAesIgeForMessageOld,
    generateKeyAndIvFromNonce,
} from '../src/utils/crypto/mtproto.js'
import { NodeCryptoProvider } from '../src/utils/crypto/node.js'

chai.use(spies)

const authKey = Buffer.alloc(
    2048 / 8,
    Buffer.from('98cb29c6ffa89e79da695a54f572e6cb101e81c688b63a4bf73c3622dec230e0', 'hex'),
)
const messageKey = Buffer.from('25d701f2a29205526757825a99eb2d32')

describe('mtproto 2.0', () => {
    it('should correctly derive message key and iv for client', () => {
        const crypto = new NodeCryptoProvider()
        const spy = chai.spy.on(crypto, 'createAesIge')

        createAesIgeForMessage(crypto, authKey, messageKey, true)

        expect(spy).to.have.been.called.with.exactly(
            Buffer.from('7acac59ab48cd370e478daf6c64545ab9f32d5c9197f25febe052110f61875ca', 'hex'),
            Buffer.from('2746ccc19fc260c08f3d2696389f415392103dbcc3a8bf69da9394c3c3d95bd3', 'hex'),
        )
    })

    it('should correctly derive message key and iv for server', () => {
        const crypto = new NodeCryptoProvider()
        const spy = chai.spy.on(crypto, 'createAesIge')

        createAesIgeForMessage(crypto, authKey, messageKey, false)

        expect(spy).to.have.been.called.with.exactly(
            Buffer.from('c7cf179e7ebab144ba87de05415db4157d2fc66df4790b2fd405a6c8cbe4c0b3', 'hex'),
            Buffer.from('0916a7bd9880eacd4eeb868577a4c6a50e76fca4ac5c1bcfbafe3b9f76ccd806', 'hex'),
        )
    })
})

describe('mtproto 1.0', () => {
    it('should correctly derive message key and iv for client', () => {
        const crypto = new NodeCryptoProvider()
        const spy = chai.spy.on(crypto, 'createAesIge')

        createAesIgeForMessageOld(crypto, authKey, messageKey, true)

        expect(spy).to.have.been.called.with.exactly(
            Buffer.from('aad61cb5b7be5e8435174d74665f8a978e85806d0970ad4958642ca49e3c8834', 'hex'),
            Buffer.from('4065736fe6586e94aad9f024062f1b9988e8a44e2aff4e11aad61cb5b7be5e84', 'hex'),
        )
    })

    it('should correctly derive message key and iv for server', () => {
        const crypto = new NodeCryptoProvider()
        const spy = chai.spy.on(crypto, 'createAesIge')

        createAesIgeForMessageOld(crypto, authKey, messageKey, false)

        expect(spy).to.have.been.called.with.exactly(
            Buffer.from('d57682a17105e43b92bc5025ea80e88ef708240fc19450dfe072a8760f9534da', 'hex'),
            Buffer.from('07addff7beeb7705ef3a9d5090bd73c992d57291bb8a7079d57682a17105e43b', 'hex'),
        )
    })
})

describe('mtproto key/iv from nonce', () => {
    it('should correctly derive message key and iv for given nonces', () => {
        const crypto = new NodeCryptoProvider()

        const res = generateKeyAndIvFromNonce(
            crypto,
            Buffer.from('8af24c551836e5ed7002f5857e6e71b2', 'hex'),
            Buffer.from('3bf48b2d3152f383d82d1f2b32ac7fb5', 'hex'),
        )

        expect(res).to.eql([
            Buffer.from('b0b5ffeadff0249fa6292f5ae0351556fd6619ba5dd4809601669292456d3e5a', 'hex'),
            Buffer.from('13fef5bfd8c46b12dfd1753013b86cc012e1ce8ed6f8ecdd7bf36f3a3bf48b2d', 'hex'),
        ])
    })
})
