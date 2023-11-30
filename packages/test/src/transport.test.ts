import { describe, expect, it } from 'vitest'

import { BaseTelegramClient } from '@mtcute/core'
import { MemoryStorage } from '@mtcute/core/src/storage/memory.js'

import { createStub } from './stub.js'
import { StubTelegramTransport } from './transport.js'

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
            storage: new MemoryStorage(),
            transport: () =>
                new StubTelegramTransport({
                    onConnect: (dc, testMode) => {
                        log.push(`connect ${dc.ipAddress}:${dc.port} test=${testMode}`)
                        client.close().catch(() => {})
                    },
                    onMessage(msg) {
                        log.push(`message size=${msg.length}`)
                    },
                }),
        })

        await client.connect().catch(() => {}) // ignore "client closed" error

        expect(log).toEqual([
            'message size=40', // req_pq_multi
            'connect 1.2.3.4:1234 test=false',
        ])
    })
})
