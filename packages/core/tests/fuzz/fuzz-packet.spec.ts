// import { expect } from 'chai'
// import { randomBytes } from 'crypto'
// import { describe, it } from 'mocha'
//
// import __tlReaderMap from '@mtcute/tl/binary/reader'
// import { TlBinaryReader } from '@mtcute/tl-runtime'
//
// import { createTestTelegramClient } from './utils.js'
//
// // eslint-disable-next-line @typescript-eslint/no-var-requires
// require('dotenv-flow').config()
//
// describe('fuzz : packet', async function () {
//     this.timeout(45000)
//
//     it('random packet', async () => {
//         const client = createTestTelegramClient()
//
//         await client.connect()
//         await client.waitUntilUsable()
//
//         let errors = 0
//
//         const conn = client.primaryConnection
//         // eslint-disable-next-line dot-notation
//         const mtproto = conn['_session']
//
//         for (let i = 0; i < 100; i++) {
//             const payload = randomBytes(Math.round(Math.random() * 16) * 16)
//
//             try {
//                 // eslint-disable-next-line dot-notation
//                 conn['_handleRawMessage'](
//                     mtproto.getMessageId().sub(1),
//                     0,
//                     new TlBinaryReader(__tlReaderMap, payload),
//                 )
//             } catch (e) {
//                 errors += 1
//             }
//         }
//
//         // similar test, but this time only using object ids that do exist
//         const objectIds = Object.keys(__tlReaderMap)
//
//         for (let i = 0; i < 100; i++) {
//             const payload = randomBytes(
//                 (Math.round(Math.random() * 16) + 1) * 16,
//             )
//             const objectId = parseInt(
//                 objectIds[Math.round(Math.random() * objectIds.length)],
//             )
//             payload.writeUInt32LE(objectId, 0)
//
//             try {
//                 // eslint-disable-next-line dot-notation
//                 conn['_handleRawMessage'](
//                     mtproto.getMessageId().sub(1),
//                     0,
//                     new TlBinaryReader(__tlReaderMap, payload),
//                 )
//             } catch (e) {
//                 errors += 1
//             }
//         }
//
//         await client.close()
//
//         expect(errors).gt(0)
//     })
// })
