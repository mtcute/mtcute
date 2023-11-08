import { expect } from 'chai'
import { describe, it } from 'mocha'

import { BaseTelegramClient } from '@mtcute/core'

import { createStub } from '../src/stub.js'
import { StubTelegramTransport } from '../src/transport.js'

describe('transport stub', () => {
    it('should correctly intercept calls', async () => {
        const log: string[] = []

        const client = new BaseTelegramClient({
            apiId: 0,
            apiHash: '',
            logLevel: 0,
            defaultDcs: {
                main: createStub('dcOption', { ipAddress: '1.2.3.4', port: 1234 }),
                media: createStub('dcOption', { ipAddress: '1.2.3.4', port: 5678 }),
            },
            transport: () =>
                new StubTelegramTransport({
                    onConnect: (dc, testMode) => {
                        log.push(`connect ${dc.ipAddress}:${dc.port} test=${testMode}`)
                        setTimeout(() => {
                            client.close().catch(() => {})
                        }, 10)
                    },
                    onMessage(msg) {
                        log.push(`message size=${msg.length}`)
                    },
                }),
        })

        await client.connect()
        await new Promise((resolve) => client.once('closed', resolve))

        expect(log).to.eql([
            'message size=40', // req_pq_multi
            'connect 1.2.3.4:1234 test=false',
        ])
    })
})
