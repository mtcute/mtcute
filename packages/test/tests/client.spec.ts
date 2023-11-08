/* eslint-disable no-restricted-globals */
import { expect } from 'chai'
import { describe, it } from 'mocha'

import { StubTelegramClient } from '../src/client.js'
import { createStub } from '../src/stub.js'

describe('client stub', () => {
    it('should correctly intercept rpc calls', async () => {
        const client = new StubTelegramClient()

        const stubConfig = createStub('config')
        client.respondWith('help.getConfig', stubConfig)

        await client.with(async () => {
            const result = await client.call({ _: 'help.getConfig' })
            expect(result).to.eql(stubConfig)
        })
    })

    it('should correctly decrypt intercepted raw messages', async () => {
        const log: string[] = []

        const client = new StubTelegramClient()

        client.onRawMessage((msg) => {
            log.push(`message ctor=${Buffer.from(msg.slice(0, 4)).toString('hex')}`)
            client.close().catch(() => {})
        })

        await client.with(async () => {
            await client.call({ _: 'help.getConfig' }).catch(() => {}) // ignore "client closed" error

            expect(log).to.eql([
                'message ctor=dcf8f173', // msg_container
            ])
        })
    })
})
