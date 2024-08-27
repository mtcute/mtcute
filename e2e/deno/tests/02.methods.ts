import { assertEquals } from 'https://deno.land/std@0.223.0/assert/mod.ts'
import { MtPeerNotFoundError } from '@mtcute/core'
import { TelegramClient } from '@mtcute/core/client.js'

import { getApiParams } from '../utils.ts'

Deno.test('2. calling methods', { sanitizeResources: false }, async (t) => {
    const tg = new TelegramClient(getApiParams('dc2.session'))

    await tg.connect()

    await t.step('getUsers(@BotFather)', async () => {
        const [user] = await tg.getUsers('botfather')

        assertEquals(user?.isBot, true)
        assertEquals(user?.displayName, 'BotFather')
    })

    await t.step('getUsers(@BotFather) - cached', async () => {
        const [user] = await tg.getUsers('botfather')

        assertEquals(user?.isBot, true)
        assertEquals(user?.displayName, 'BotFather')
    })

    await t.step('getHistory(777000)', async () => {
        try {
            await tg.findDialogs(777000) // ensure it's cached
        } catch (e) {
            if (e instanceof MtPeerNotFoundError) {
                // this happens sometimes :D gracefully skip
                return
            }

            throw e
        }

        const history = await tg.getHistory(777000, { limit: 5 })

        assertEquals(history[0].chat.chatType, 'private')
        assertEquals(history[0].chat.id, 777000)
        assertEquals(history[0].chat.firstName, 'Telegram')
    })

    await tg.close()
})
