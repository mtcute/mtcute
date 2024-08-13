import { assertEquals } from 'https://deno.land/std@0.223.0/assert/mod.ts'
import { User, tl } from '@mtcute/core'
import { BaseTelegramClient, TelegramClient } from '@mtcute/core/client.js'

import { getApiParams } from '../utils.ts'

function getAccountId() {
    return Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0')
}

async function authorizeInDc(dc: number, base: BaseTelegramClient) {
    const tg = new TelegramClient({ client: base })

    while (true) {
        await base.mt.storage.load()
        await base.storage.clear(true)

        const phone = `99966${dc}${getAccountId()}`

        let user

        try {
            const sentCode = await tg.sendCode({ phone })

            let auth = await tg.call({
                _: 'auth.signIn',
                phoneNumber: phone,
                phoneCode: `${dc}${dc}${dc}${dc}${dc}`,
                phoneCodeHash: sentCode.phoneCodeHash,
            })

            if (auth._ === 'auth.authorizationSignUpRequired') {
                auth = await tg.call({
                    _: 'auth.signUp',
                    phoneNumber: phone,
                    phoneCodeHash: sentCode.phoneCodeHash,
                    firstName: 'mtcute e2e',
                    lastName: '',
                })

                if (auth._ !== 'auth.authorization') {
                    throw new Error('Unexpected response')
                }
            }

            await tg.notifyLoggedIn(auth)

            user = new User(auth.user)
        } catch (e) {
            if (tl.RpcError.is(e, 'SESSION_PASSWORD_NEEDED') || tl.RpcError.is(e, 'PHONE_NUMBER_FLOOD')) {
                // retry with another number
                await tg.close()
                continue
            }

            throw e
        }

        await tg.close()

        assertEquals(user.isSelf, true)
        assertEquals(user.phoneNumber, phone)
        break
    }
}

Deno.test('1. authorization', { sanitizeResources: false }, async (t) => {
    await t.step('should authorize in default dc', async () => {
        const base = new BaseTelegramClient(getApiParams('dc2.session'))

        await authorizeInDc(2, base)
    })

    await t.step('should authorize in dc 1', async () => {
        const base = new BaseTelegramClient(getApiParams('dc1.session'))

        await authorizeInDc(1, base)
    })
})
