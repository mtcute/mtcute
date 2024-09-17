import { describe, expect, it } from 'vitest'
import { hex } from '@fuman/utils'

import { StubTelegramClient } from './client.js'
import { createStub } from './stub.js'

describe('client stub', () => {
    it('should correctly intercept rpc calls', async () => {
        const client = new StubTelegramClient()

        const stubConfig = createStub('config')
        client.respondWith('help.getConfig', () => stubConfig)

        await client.with(async () => {
            const result = await client.call({ _: 'help.getConfig' })
            expect(result).toEqual(stubConfig)
        })
    })

    // for some reason, this test fails in browser. todo: investigate
    if (import.meta.env.TEST_ENV !== 'browser') {
        it('should correctly decrypt intercepted raw messages', async () => {
            const log: string[] = []

            const client = new StubTelegramClient()

            client.onRawMessage((msg) => {
                log.push(`message ctor=${hex.encode(msg.subarray(0, 4))}`)
                client.close().catch(() => {})
            })

            await client.with(async () => {
                await client.call({ _: 'help.getConfig' }).catch(() => {}) // ignore "client closed" error

                expect(log).toEqual([
                    'message ctor=dcf8f173', // msg_container
                ])
            })
        })
    }
})
