import { describe, it } from 'mocha'
import { expect } from 'chai'
import { randomBytes } from 'crypto'
import { TlBinaryReader } from '@mtcute/tl-runtime'
import __tlReaderMap from '@mtcute/tl/binary/reader'
import { createTestTelegramClient } from './utils'

require('dotenv-flow').config()

describe('fuzz : packet', async function () {
    this.timeout(45000)

    it('random packet', async () => {
        const client = createTestTelegramClient()

        await client.connect()
        await client.waitUntilUsable()

        let errors = 0

        const conn = client.primaryConnection
        const mtproto = conn['_session']

        for (let i = 0; i < 100; i++) {
            const payload = randomBytes(Math.round(Math.random() * 16) * 16)

            try {
                conn['_handleRawMessage'](
                    mtproto.getMessageId().sub(1),
                    0,
                    new TlBinaryReader(__tlReaderMap, payload)
                )
            } catch (e) {
                errors += 1
            }
        }

        // similar test, but this time only using object ids that do exist
        const objectIds = Object.keys(__tlReaderMap)
        for (let i = 0; i < 100; i++) {
            const payload = randomBytes(
                (Math.round(Math.random() * 16) + 1) * 16
            )
            const objectId = parseInt(
                objectIds[Math.round(Math.random() * objectIds.length)]
            )
            payload.writeUInt32LE(objectId, 0)

            try {
                conn['_handleRawMessage'](
                    mtproto.getMessageId().sub(1),
                    0,
                    new TlBinaryReader(__tlReaderMap, payload)
                )
            } catch (e) {
                errors += 1
            }
        }

        await client.close()

        expect(errors).gt(0)
    })
})
