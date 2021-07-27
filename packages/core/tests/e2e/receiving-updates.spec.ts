import { describe, it } from 'mocha'
import { expect } from 'chai'
import { BaseTelegramClient, bufferToBigInt, defaultDcs, randomBytes, tl } from '../../src'
import { sleep } from '../../src/utils/misc-utils'
import { createTestTelegramClient } from './utils'

require('dotenv-flow').config()

async function createClientPair(
    session1: string,
    session2: string
): Promise<[BaseTelegramClient, BaseTelegramClient]> {
    const client1 = createTestTelegramClient()

    if (session1.indexOf(':') > -1) {
        // bot token
        await client1.call({
            _: 'auth.importBotAuthorization',
            apiId: parseInt(process.env.API_ID!),
            apiHash: process.env.API_HASH!,
            botAuthToken: session1,
            flags: 0
        })
    } else {
        client1.importSession(session1)
    }

    const client2 = createTestTelegramClient()

    if (session2.indexOf(':') > -1) {
        // bot token
        await client2.call({
            _: 'auth.importBotAuthorization',
            apiId: parseInt(process.env.API_ID!),
            apiHash: process.env.API_HASH!,
            botAuthToken: session2,
            flags: 0
        })
    } else {
        client2.importSession(session2)
    }

    return [client1, client2]
}

describe('e2e : receiving updates', function () {
    if (!process.env.BOT_TOKEN || !process.env.USER_SESSION) {
        console.warn('Warning: skipping e2e updates test (no API_ID or API_HASH)')
        return
    }

    this.timeout(60000)

    it('receiving from user by bot', async () => {
        const [actor, observer] = await createClientPair(
            process.env.USER_SESSION!,
            process.env.BOT_TOKEN!
        )

        await observer.connect()
        await observer.waitUntilUsable()

        let updatesCount = 0

        observer['_handleUpdate'] = function() {
            updatesCount += 1
        }

        const bot = await actor.call({
            _: 'contacts.resolveUsername',
            username: process.env.BOT_USERNAME!
        }).then((res) => res.users[0])

        expect(bot._).eq('user')

        const inputPeer: tl.TypeInputPeer = {
            _: 'inputPeerUser',
            userId: bot.id,
            accessHash: (bot as tl.RawUser).accessHash!
        }

        await actor.call({
            _: 'messages.startBot',
            bot: {
                _: 'inputUser',
                userId: bot.id,
                accessHash: (bot as tl.RawUser).accessHash!
            },
            peer: inputPeer,
            randomId: bufferToBigInt(randomBytes(8)),
            startParam: '123'
        })

        for (let i = 0; i < 5; i++) {
            await actor.call({
                _: 'messages.sendMessage',
                peer: inputPeer,
                randomId: bufferToBigInt(randomBytes(8)),
                message: `Test ${i}`
            })
            await sleep(1000)
        }

        // to make sure the updates were delivered
        await sleep(5000)

        // 5 messages + /start = 6
        // it is assumed that there were no gaps
        expect(updatesCount).gte(6)

        await actor.close()
        await observer.close()
    })

    it('receiving from user by user', async () => {
        const [actor, observer] = await createClientPair(
            process.env.USER_SESSION!,
            process.env.USER_OTHER_DC_SESSION!
        )

        await observer.connect()
        await observer.waitUntilUsable()

        let updatesCount = 0

        observer['_handleUpdate'] = function() {
            updatesCount += 1
        }

        const user = await actor.call({
            _: 'contacts.resolveUsername',
            username: process.env.USER_OTHER_DC_USERNAME!
        }).then((res) => res.users[0])

        expect(user._).eq('user')

        const inputPeer: tl.TypeInputPeer = {
            _: 'inputPeerUser',
            userId: user.id,
            accessHash: (user as tl.RawUser).accessHash!
        }
        for (let i = 0; i < 5; i++) {
            await sleep(1000)
            await actor.call({
                _: 'messages.sendMessage',
                peer: inputPeer,
                randomId: bufferToBigInt(randomBytes(8)),
                message: `Test ${i}`
            })
        }

        // to make sure the updates were delivered
        await sleep(5000)

        // 5 messages
        // it is assumed that there were no gaps
        expect(updatesCount).gte(5)

        await actor.close()
        await observer.close()
    })
})
