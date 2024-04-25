import { describe, expect, it, vi } from 'vitest'

import { defaultTestCryptoProvider, u8HexDecode } from '@mtcute/test'

import { getPlatform } from '../../platform.js'
import { LogManager } from '../../utils/index.js'
import { IntermediatePacketCodec } from './intermediate.js'
import { MtProxyInfo, ObfuscatedPacketCodec } from './obfuscated.js'

const p = getPlatform()

describe('ObfuscatedPacketCodec', () => {
    const create = async (randomSource?: string, proxy?: MtProxyInfo) => {
        const codec = new ObfuscatedPacketCodec(new IntermediatePacketCodec(), proxy)
        const crypto = await defaultTestCryptoProvider(randomSource)
        codec.setup(crypto, new LogManager())

        return [codec, crypto] as const
    }

    describe('tag', () => {
        it('should correctly generate random initial payload', async () => {
            const random = 'ff'.repeat(64)
            const [codec] = await create(random)

            const tag = await codec.tag()

            expect(p.hexEncode(tag)).toEqual(
                'ff'.repeat(56) + 'fce8ab2203db2bff', // encrypted part
            )
        })

        describe('mtproxy', () => {
            it('should correctly generate random initial payload for prod dc', async () => {
                const random = 'ff'.repeat(64)
                const proxy: MtProxyInfo = {
                    dcId: 1,
                    secret: new Uint8Array(16),
                    test: false,
                    media: false,
                }
                const [codec] = await create(random, proxy)

                const tag = await codec.tag()

                expect(p.hexEncode(tag)).toEqual(
                    'ff'.repeat(56) + 'ecec4cbda8bb188b', // encrypted part with dcId = 1
                )
            })

            it('should correctly generate random initial payload for test dc', async () => {
                const random = 'ff'.repeat(64)
                const proxy: MtProxyInfo = {
                    dcId: 1,
                    secret: new Uint8Array(16),
                    test: true,
                    media: false,
                }
                const [codec] = await create(random, proxy)

                const tag = await codec.tag()

                expect(p.hexEncode(tag)).toEqual(
                    'ff'.repeat(56) + 'ecec4cbdb89c188b', // encrypted part with dcId = 10001
                )
            })

            it('should correctly generate random initial payload for media dc', async () => {
                const random = 'ff'.repeat(64)
                const proxy: MtProxyInfo = {
                    dcId: 1,
                    secret: new Uint8Array(16),
                    test: false,
                    media: true,
                }
                const [codec] = await create(random, proxy)

                const tag = await codec.tag()

                expect(p.hexEncode(tag)).toEqual(
                    'ff'.repeat(56) + 'ecec4cbd5644188b', // encrypted part with dcId = -1
                )
            })
        })

        it.each([
            ['ef'],
            ['48454144'],
            ['504f5354'],
            ['47455420'],
            ['4f505449'],
            ['dddddddd'],
            ['eeeeeeee'],
            ['16030102'],
        ])('should correctly retry for %s prefix', async (prefix) => {
            const random = prefix + 'ff'.repeat(64 - prefix.length / 2)
            const [codec] = await create(random)

            // generating random payload requires 64 bytes of entropy, so
            // if it asks for more, it means it tried to generate it again
            await expect(() => codec.tag()).rejects.toThrow('not enough entropy')
        })
    })

    it('should correctly create aes ctr', async () => {
        const [codec, crypto] = await create()

        const spyCreateAesCtr = vi.spyOn(crypto, 'createAesCtr')

        await codec.tag()

        expect(spyCreateAesCtr).toHaveBeenCalledTimes(2)
        expect(spyCreateAesCtr).toHaveBeenNthCalledWith(
            1,
            u8HexDecode('10b6b4ad6d56ef5df9453f88e6ee6adb6e0544ba635dc6a8a990c9b8b980c343'),
            u8HexDecode('936b33fa7f97bae025102532233abb26'),
            true,
        )
        expect(spyCreateAesCtr).toHaveBeenNthCalledWith(
            2,
            u8HexDecode('26bb3a2332251025e0ba977ffa336b9343c380b9b8c990a9a8c65d63ba44056e'),
            u8HexDecode('db6aeee6883f45f95def566dadb4b610'),
            false,
        )
    })

    it('should correctly create aes ctr for mtproxy', async () => {
        const proxy: MtProxyInfo = {
            dcId: 1,
            secret: p.hexDecode('00112233445566778899aabbccddeeff'),
            test: true,
            media: false,
        }
        const [codec, crypto] = await create(undefined, proxy)

        const spyCreateAesCtr = vi.spyOn(crypto, 'createAesCtr')

        await codec.tag()

        expect(spyCreateAesCtr).toHaveBeenCalledTimes(2)
        expect(spyCreateAesCtr).toHaveBeenNthCalledWith(
            1,
            u8HexDecode('dd03188944590983e28dad14d97d0952389d118af4ffcbdb28d56a6a612ef7a6'),
            u8HexDecode('936b33fa7f97bae025102532233abb26'),
            true,
        )
        expect(spyCreateAesCtr).toHaveBeenNthCalledWith(
            2,
            u8HexDecode('413b8e08021fbb08a2962b6d7187194fe46565c6b329d3bbdfcffd4870c16119'),
            u8HexDecode('db6aeee6883f45f95def566dadb4b610'),
            false,
        )
    })

    it('should correctly encrypt the underlying codec', async () => {
        const data = p.hexDecode('6cfeffff')
        const msg1 = 'a1020630a410e940'
        const msg2 = 'f53ff53f371db495'

        const [codec] = await create()

        await codec.tag()

        expect(p.hexEncode(await codec.encode(data))).toEqual(msg1)
        expect(p.hexEncode(await codec.encode(data))).toEqual(msg2)
    })

    it('should correctly decrypt the underlying codec', async () => {
        const msg1 = 'e8027df708ab3b5c'
        const msg2 = '1854be76d2df4949'

        const [codec] = await create()

        await codec.tag()

        const log: string[] = []

        codec.on('error', (e: Error) => {
            log.push(e.toString())
        })

        codec.feed(p.hexDecode(msg1))
        codec.feed(p.hexDecode(msg2))

        await vi.waitFor(() => expect(log).toEqual(['Error: Transport error: 404', 'Error: Transport error: 404']))
    })

    it('should correctly reset', async () => {
        const inner = new IntermediatePacketCodec()
        const spyInnerReset = vi.spyOn(inner, 'reset')

        const codec = new ObfuscatedPacketCodec(inner)
        codec.setup(await defaultTestCryptoProvider(), new LogManager())

        await codec.tag()

        codec.reset()

        expect(spyInnerReset).toHaveBeenCalledTimes(1)
    })
})
