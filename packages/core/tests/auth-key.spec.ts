/* eslint-disable no-restricted-globals */
import chai, { expect } from 'chai'
import spies from 'chai-spies'
import { describe, it } from 'mocha'

import { TlReaderMap } from '@mtcute/tl-runtime'

import { AuthKey } from '../src/network/auth-key.js'
import { NodeCryptoProvider } from '../src/utils/crypto/node.js'
import { LogManager } from '../src/utils/index.js'

chai.use(spies)

const authKey = Buffer.alloc(
    2048 / 8,
    Buffer.from('98cb29c6ffa89e79da695a54f572e6cb101e81c688b63a4bf73c3622dec230e0', 'hex'),
)

describe('AuthKey', () => {
    const crypto = new NodeCryptoProvider()
    const logger = new LogManager()
    const readerMap: TlReaderMap = {}

    it('should correctly calculate derivatives', () => {
        const key = new AuthKey(crypto, logger, readerMap)
        key.setup(authKey)

        expect(key.key).to.eql(authKey)
        expect(key.clientSalt).to.eql(
            Buffer.from('f73c3622dec230e098cb29c6ffa89e79da695a54f572e6cb101e81c688b63a4b', 'hex'),
        )
        expect(key.serverSalt).to.eql(
            Buffer.from('98cb29c6ffa89e79da695a54f572e6cb101e81c688b63a4bf73c3622dec230e0', 'hex'),
        )
        expect(key.id).to.eql(Buffer.from('40fa5bb7cb56a895', 'hex'))
    })

    // todo - need predictable random bytes
    // it('should correctly encrypt a message', async () => {
    //     const crypto = new NodeCryptoProvider()
    //     const key = new AuthKey(crypto, logger, readerMap)
    //     await key.setup(authKey)
    //
    //     const msg = await key.encryptMessage(message, serverSalt, sessionId)
    //
    //     expect(msg).to.eql(
    //         Buffer.from(
    //             '...',
    //             'hex',
    //         ),
    //     )
    // })
})
