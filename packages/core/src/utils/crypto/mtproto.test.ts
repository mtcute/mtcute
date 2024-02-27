import { beforeEach, describe, expect, it, vi } from 'vitest'

import { defaultTestCryptoProvider, u8HexDecode } from '@mtcute/test'

import { getPlatform } from '../../platform.js'
import { concatBuffers } from '../index.js'
import { createAesIgeForMessage, createAesIgeForMessageOld, generateKeyAndIvFromNonce } from './mtproto.js'

const p = getPlatform()

const authKeyChunk = p.hexDecode('98cb29c6ffa89e79da695a54f572e6cb101e81c688b63a4bf73c3622dec230e0')
const authKey = concatBuffers(Array.from({ length: 8 }, () => authKeyChunk))
const messageKey = p.hexDecode('25d701f2a29205526757825a99eb2d32')

describe('mtproto 2.0', async () => {
    const crypto = await defaultTestCryptoProvider()
    const createAesIgeSpy = vi.spyOn(crypto, 'createAesIge')

    beforeEach(() => void createAesIgeSpy.mockClear())

    it('should correctly derive message key and iv for client', () => {
        createAesIgeForMessage(crypto, authKey, messageKey, true)

        expect(p.hexEncode(createAesIgeSpy.mock.calls[0][0])).toEqual(
            'af3f8e1ffa75f4c981eec33a3e5bbaa2ea48f9bb93e91597627eb1f67960a0c9',
        )
        expect(p.hexEncode(createAesIgeSpy.mock.calls[0][1])).toEqual(
            '9874d77f95155b35221bff94b7df4594c6996e2a62e44fcb7d93c8c4e41b79ee',
        )
    })

    it('should correctly derive message key and iv for server', () => {
        createAesIgeForMessage(crypto, authKey, messageKey, false)

        expect(p.hexEncode(createAesIgeSpy.mock.calls[0][0])).toEqual(
            'd4b378e1e0525f10ff9d4c42807ccce5b30a033a8088c0b922b5259421751648',
        )
        expect(p.hexEncode(createAesIgeSpy.mock.calls[0][1])).toEqual(
            '4d7194f42f0135d2fd83050b403265b4c40ee3e9e9fba56f0f4d8ea6bcb121f5',
        )
    })
})

describe('mtproto 1.0', async () => {
    const crypto = await defaultTestCryptoProvider()
    const createAesIgeSpy = vi.spyOn(crypto, 'createAesIge')

    beforeEach(() => void createAesIgeSpy.mockClear())

    it('should correctly derive message key and iv for client', () => {
        createAesIgeForMessageOld(crypto, authKey, messageKey, true)

        expect(p.hexEncode(createAesIgeSpy.mock.calls[0][0])).toEqual(
            '1fc7b40b1d9ffbdaf4d652525a748864259698f89214abf27c0d36cb9d4cd5db',
        )
        expect(p.hexEncode(createAesIgeSpy.mock.calls[0][1])).toEqual(
            '7251fbda39ec5e6e089f15ded5963b03d6d8d0f7078898431fc7b40b1d9ffbda',
        )
    })

    it('should correctly derive message key and iv for server', () => {
        createAesIgeForMessageOld(crypto, authKey, messageKey, false)

        expect(p.hexEncode(createAesIgeSpy.mock.calls[0][0])).toEqual(
            'af0e4e01318654be40ab42b125909d43b44bdeef571ff1a5dfb81474ae26d467',
        )
        expect(p.hexEncode(createAesIgeSpy.mock.calls[0][1])).toEqual(
            '15c9ba6021d2c5cf04f0842540ae216a970b4eac8f46ef01af0e4e01318654be',
        )
    })
})

describe('mtproto key/iv from nonce', async () => {
    const crypto = await defaultTestCryptoProvider()

    it('should correctly derive message key and iv for given nonces', () => {
        const res = generateKeyAndIvFromNonce(
            crypto,
            u8HexDecode('8af24c551836e5ed7002f5857e6e71b2'),
            u8HexDecode('3bf48b2d3152f383d82d1f2b32ac7fb5'),
        )

        expect(res).to.eql([
            u8HexDecode('b0b5ffeadff0249fa6292f5ae0351556fd6619ba5dd4809601669292456d3e5a'),
            u8HexDecode('13fef5bfd8c46b12dfd1753013b86cc012e1ce8ed6f8ecdd7bf36f3a3bf48b2d'),
        ])
    })
})
