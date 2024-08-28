// todo: fuman
// import { describe, expect, it, vi } from 'vitest'
// import { MemoryStorage } from '@mtcute/core'
// import { BaseTelegramClient } from '@mtcute/core/client.js'

// import { defaultCryptoProvider } from './platform.js'
// import { createStub } from './stub.js'
// import { StubTelegramTransport } from './transport.js'

// describe('transport stub', () => {
//     it('should correctly intercept calls', async () => {
//         const log: string[] = []

//         const client = new BaseTelegramClient({
//             apiId: 0,
//             apiHash: '',
//             logLevel: 0,
//             defaultDcs: {
//                 main: createStub('dcOption', { ipAddress: '1.2.3.4', port: 1234 }),
//                 media: createStub('dcOption', { ipAddress: '1.2.3.4', port: 5678 }),
//             },
//             storage: new MemoryStorage(),
//             crypto: defaultCryptoProvider,
//             transport: () =>
//                 new StubTelegramTransport({
//                     onConnect: (dc, testMode) => {
//                         log.push(`connect ${dc.ipAddress}:${dc.port} test=${testMode}`)
//                         client.close().catch(() => {})
//                     },
//                     onMessage(msg) {
//                         log.push(`message size=${msg.length}`)
//                     },
//                 }),
//         })

//         client.connect().catch(() => {}) // ignore "client closed" error

//         await vi.waitFor(() =>
//             expect(log).toEqual([
//                 'message size=40', // req_pq_multi
//                 'connect 1.2.3.4:1234 test=false',
//             ]),
//         )
//     })
// })
