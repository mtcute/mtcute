import { describe, it } from 'mocha'
import { expect } from 'chai'
import {
    BinaryReader,
    BinaryWriter,
    randomBytes,
} from '../../src'
import { sleep } from '../../src/utils/misc-utils'
import { createAesIgeForMessage } from '../../src/utils/crypto/mtproto'
import { createTestTelegramClient } from '../e2e/utils'

require('dotenv-flow').config()

describe('fuzz : packet', async function () {
    this.timeout(45000)

    it('random packet', async () => {
        const client = createTestTelegramClient()

        await client.connect()
        await client.waitUntilUsable()

        const errors: Error[] = []

        const errorHandler = (err: Error) => {
            errors.push(err)
        }

        client.onError(errorHandler)

        const conn = client.primaryConnection
        const mtproto = conn['_mtproto']

        const createFakeMtprotoPacket = async (payload: Buffer): Promise<Buffer> => {
            // create a fake mtproto packet
            const messageId = conn['_getMessageId']().minus(1) // must be odd

            const innerWriter = BinaryWriter.alloc(payload.length + 32)
            innerWriter.raw(mtproto.serverSalt)
            innerWriter.raw(mtproto._sessionId)
            innerWriter.long(messageId)
            innerWriter.int32(0) // seqno
            innerWriter.int32(payload.length)
            innerWriter.raw(payload)

            const innerData = innerWriter.result()

            const messageKey = (
                await mtproto._crypto.sha256(
                    Buffer.concat([mtproto._authKeyServerSalt!, innerData])
                )
            ).slice(8, 24)
            const ige = await createAesIgeForMessage(
                mtproto._crypto,
                mtproto._authKey!,
                messageKey,
                false
            )
            const encryptedData = await ige.encrypt(innerData)

            const writer = BinaryWriter.alloc(24 + encryptedData.length)
            writer.raw(mtproto._authKeyId!)
            writer.raw(messageKey)

            return Buffer.concat([mtproto._authKeyId!, messageKey, encryptedData])
        }

        for (let i = 0; i < 100; i++) {
            const payload = randomBytes(Math.round(Math.random() * 16) * 16)

            await conn['onMessage'](await createFakeMtprotoPacket(payload))
            await sleep(100)
        }

        // similar test, but this time only using object ids that do exist
        const objectIds = Object.keys(new BinaryReader(Buffer.alloc(0))._objectsMap)
        for (let i = 0; i < 100; i++) {
            const payload = randomBytes((Math.round(Math.random() * 16) + 1) * 16)
            const objectId = parseInt(objectIds[Math.round(Math.random() * objectIds.length)])
            payload.writeUInt32LE(objectId, 0)

            await conn['onMessage'](await createFakeMtprotoPacket(payload))
            await sleep(100)
        }

        await client.close()

        expect(errors.length).gt(0)
    })
})
