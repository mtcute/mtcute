import Long from 'long'
import { describe, expect, it, vi } from 'vitest'

import { defaultTestCryptoProvider } from '@mtcute/test'
import {
    TlBinaryReader,
    TlReaderMap,
} from '@mtcute/tl-runtime'

import { getPlatform } from '../platform.js'
import { LogManager } from '../utils/index.js'
import { AuthKey } from './auth-key.js'

const authKey = new Uint8Array(256)
const p = getPlatform()

for (let i = 0; i < 256; i += 32) {
    authKey.subarray(i, i + 32).set(p.hexDecode('98cb29c6ffa89e79da695a54f572e6cb101e81c688b63a4bf73c3622dec230e0'))
}

describe('AuthKey', () => {
    async function create() {
        const logger = new LogManager()
        const readerMap: TlReaderMap = {}
        const crypto = await defaultTestCryptoProvider()

        const key = new AuthKey(crypto, logger, readerMap)
        key.setup(authKey)

        return key
    }

    const msgId = Long.fromBits(0xbeef1234, 0x1234beef, true)
    const seqNo = 777
    const serverSalt = Long.fromBits(0xdeadbeef, 0xbeefdead)
    const sessionId = Long.fromBits(0xfeedbeef, 0xbeeffeed)

    function writeMessage(body: Uint8Array) {
        const buf = new Uint8Array(16 + body.length)
        const dv = new DataView(buf.buffer)

        dv.setInt32(0, msgId.low, true)
        dv.setInt32(4, msgId.high, true)
        dv.setInt32(8, seqNo, true)
        dv.setInt32(12, body.length, true)
        buf.set(body, 16)

        return buf
    }

    it('should calculate derivatives', async () => {
        const key = await create()

        expect(p.hexEncode(key.key)).toEqual(p.hexEncode(authKey))
        expect(p.hexEncode(key.clientSalt)).toEqual('f73c3622dec230e098cb29c6ffa89e79da695a54f572e6cb101e81c688b63a4b')
        expect(p.hexEncode(key.serverSalt)).toEqual('98cb29c6ffa89e79da695a54f572e6cb101e81c688b63a4bf73c3622dec230e0')
        expect(p.hexEncode(key.id)).toEqual('40fa5bb7cb56a895')
    })

    it('should encrypt a message', async () => {
        const message = writeMessage(p.utf8Encode('hello, world!!!!'))

        const key = await create()
        const msg = key.encryptMessage(message, serverSalt, sessionId)

        expect(p.hexEncode(msg)).toEqual(
            '40fa5bb7cb56a895f6f5a88914892aadf87c68031cc953ba29d68e118021f329' +
                'be386a620d49f3ad3a50c60dcef3733f214e8cefa3e403c11d193637d4971dc1' +
                '5db7f74b26fd16cb0e8fee30bf7e3f68858fe82927e2cd06',
        )
    })

    describe('decrypt', () => {
        async function decrypt(message: Uint8Array) {
            const key = await create()

            return new Promise<[Long, number, TlBinaryReader]>((resolve, reject) => {
                // in this method, errors are not thrown but rather logged
                vi.spyOn(key.log, 'warn').mockImplementation((msg, ...fmt) =>
                    reject(`${msg} : ${fmt.map((it) => JSON.stringify(it)).join(' ')}`),
                )

                key.decryptMessage(message, sessionId, (...args) => resolve(args))
            })
        }

        it('should decrypt a message', async () => {
            const message = p.hexDecode(
                '40fa5bb7cb56a8950c394b884f1529efc42fea22d972fea650a714ce6d2d1bdb' +
                    '3d98ff5929b8768c401771a69795f36a7e720dcafac2efbccd0ba368e8a7f48b' +
                    '07362cac1a32ffcabe188b51a36cc4d54e1d0633cf9eaf35',
            )

            const [decMsgId, decSeqNo, data] = await decrypt(message)

            expect(decMsgId).toEqual(msgId)
            expect(decSeqNo).toEqual(seqNo)
            expect(p.utf8Decode(data.raw(16))).toEqual('hello, world!!!!')
        })

        it('should decrypt a message with padding', async () => {
            const message = p.hexDecode(
                '40fa5bb7cb56a8950c394b884f1529efc42fea22d972fea650a714ce6d2d1bdb' +
                    '3d98ff5929b8768c401771a69795f36a7e720dcafac2efbccd0ba368e8a7f48b' +
                    '07362cac1a32ffcabe188b51a36cc4d54e1d0633cf9eaf35' +
                    'deadbeef', // some padding (e.g. from padded transport),
            )

            const [decMsgId, decSeqNo, data] = await decrypt(message)

            expect(decMsgId).toEqual(msgId)
            expect(decSeqNo).toEqual(seqNo)
            expect(p.utf8Decode(data.raw(16))).toEqual('hello, world!!!!')
        })

        it('should ignore messages with invalid message key', async () => {
            const message = p.hexDecode(
                '40fa5bb7cb56a8950000000000000000000000000000000050a714ce6d2d1bdb' +
                    '3d98ff5929b8768c401771a69795f36a7e720dcafac2efbccd0ba368e8a7f48b' +
                    '07362cac1a32ffcabe188b51a36cc4d54e1d0633cf9eaf35',
            )

            await expect(() => decrypt(message)).rejects.toThrow('message with invalid messageKey')
        })

        it('should ignore messages with invalid session_id', async () => {
            const message = p.hexDecode(
                '40fa5bb7cb56a895a986a7e97f4e90aa2769b5e702c6e86f5e1e82c6ff0c6829' +
                    '2521a2ba9704fa37fb341d895cf32662c6cf47ba31cbf27c30d5c03f6c2930f4' +
                    '30fd8858b836b73fe32d4a95b8ebcdbc9ca8908f7964c40a',
            )

            await expect(() => decrypt(message)).rejects.toThrow('message with invalid sessionId')
        })

        it('should ignore messages with invalid length', async () => {
            const messageTooLong = p.hexDecode(
                '40fa5bb7cb56a8950d19412233dd5d24be697c73274e08fbe515cf65e0c5f70c' +
                    'ad75fd2badc18c9f999f287351144eeb1cfcaa9bea33ef5058999ad96a498306' +
                    '08d2859425685a55b21fab413bfabc42ec5da283853b28c0',
            )
            const messageUnaligned = p.hexDecode(
                '40fa5bb7cb56a8957b4e4bec561eee4a5a1025bc8a35d3d0c79a3685d2b90ff0' +
                    '5f638e9c42c9fd9448b0ce8e7d49e7ea1ce458e47b825b5c7fd8ddf5b4fded46' +
                    '2a4bcc02f3ff2e89de6764d6d219f575e457fdcf8c163cdf',
            )

            await expect(() => decrypt(messageTooLong)).rejects.toThrow('message with invalid length: %d > %d')
            await expect(() => decrypt(messageUnaligned)).rejects.toThrow(
                'message with invalid length: %d is not a multiple of 4',
            )
        })

        it('should ignore messages with invalid padding', async () => {
            const message = p.hexDecode(
                '40fa5bb7cb56a895133671d1c637a9836e2c64b4d1a0521d8a25a6416fd4dc9e' +
                    '79f9478fb837703cc9efa0a19d12143c2a26e57cb4bc64d7bc972dd8f19c53c590cc258162f44afc',
            )

            await expect(() => decrypt(message)).rejects.toThrow('message with invalid padding size')
        })
    })
})
