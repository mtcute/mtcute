import { describe, it } from 'mocha'
import { expect } from 'chai'
import { randomBytes, sleep } from '../../src'
import { createTestTelegramClient } from '../e2e/utils'
import { tl } from '@mtcute/tl'

require('dotenv-flow').config()

describe('fuzz : session', async function () {
    this.timeout(45000)

    it('random auth_key', async () => {
        const client = createTestTelegramClient()

        // random key
        const initKey = randomBytes(256)
        await client.storage.setAuthKeyFor(2, initKey)

        // client is supposed to handle this and generate a new key


        const errors: Error[] = []

        const errorHandler = (err: Error) => {
            errors.push(err)
        }

        client.onError(errorHandler)

        await client.connect()

        await sleep(10000)

        await client.close()

        expect(errors.length).eq(0)

        expect((await client.storage.getAuthKeyFor(2))!.toString('hex')).not.eq(
            initKey.toString('hex')
        )
    })

    it('random auth_key for other dc', async () => {
        const client = createTestTelegramClient()

        // random key for dc1
        const initKey = randomBytes(256)
        await client.storage.setAuthKeyFor(1, initKey)

        // client is supposed to handle this and generate a new key

        const errors: Error[] = []

        const errorHandler = (err: Error) => {
            errors.push(err)
        }

        client.onError(errorHandler)

        await client.connect()
        await client.waitUntilUsable()

        const conn = await client.createAdditionalConnection(1)
        await conn.sendRpc({ _: 'help.getConfig' })

        await sleep(10000)

        await client.close()

        expect(errors.length).eq(0)

        expect((await client.storage.getAuthKeyFor(1))!.toString('hex')).not.eq(
            initKey.toString('hex')
        )
    })

    if (!process.env.USER_SESSION) {
        console.warn('Warning: skipping fuzz session test with auth (no USER_SESSION)')
        return
    }

    it('random auth_key for other dc with auth', async () => {
        const client = createTestTelegramClient()

        client.importSession(process.env.USER_SESSION!)

        // random key for dc1
        const initKey = randomBytes(256)
        await client.storage.setAuthKeyFor(1, initKey)

        // client is supposed to handle this and generate a new key,
        // and then export auth there

        const errors: Error[] = []

        const errorHandler = (err: Error) => {
            errors.push(err)
        }

        client.onError(errorHandler)

        await client.connect()
        await client.waitUntilUsable()

        const conn = await client.createAdditionalConnection(1)

        let hadError = false
        try {
            await client.call({
                _: 'users.getUsers',
                id: [
                    {
                        _: 'inputUserSelf'
                    }
                ]
            }, { connection: conn })
        } catch (e) {
            if (e instanceof tl.errors.UserMigrateXError) {
                hadError = true
            }
        }

        await client.close()

        expect(errors.length).eq(0)

        expect((await client.storage.getAuthKeyFor(1))!.toString('hex')).not.eq(
            initKey.toString('hex')
        )
        expect(hadError).true
    })
})
