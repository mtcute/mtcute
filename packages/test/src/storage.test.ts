import { describe, expect, it } from 'vitest'

import { BaseTelegramClient } from '@mtcute/core'

import { StubMemoryTelegramStorage } from './storage.js'
import { createStub } from './stub.js'
import { StubTelegramTransport } from './transport.js'

describe('storage stub', () => {
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
                    onMessage: (msg) => {
                        if (msg.slice(0, 8).reduce((a, b) => a + b, 0) === 0) {
                            // should not happen, since we're providing stub keys
                            log.push('unauthed_message')
                        }
                        setTimeout(() => {
                            client.close().catch(() => {})
                        }, 10)
                    },
                }),
            storage: new StubMemoryTelegramStorage({
                hasKeys: true,
                onLoad: () => log.push('load'),
                onSave: () => log.push('save'),
                onDestroy: () => log.push('destroy'),
                onReset: () => log.push('reset'),
            }),
        })

        await client.connect()
        await client.call({ _: 'help.getConfig' }).catch(() => {}) // ignore "client closed" error

        expect(log).toEqual(['load', 'save', 'destroy'])
    })
})
