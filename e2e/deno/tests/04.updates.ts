import type { Message } from '@mtcute/core'
import { TelegramClient } from '@mtcute/core/client.js'
import { assertEquals, assertNotEquals } from 'https://deno.land/std@0.223.0/assert/mod.ts'

import { getApiParams, waitFor } from '../utils.ts'

Deno.test('4. handling updates', { sanitizeResources: false }, async (t) => {
    const tg1 = new TelegramClient(getApiParams('dc1.session'))
    tg1.log.prefix = '[tg1] '
    const tg2 = new TelegramClient(getApiParams('dc2.session'))
    tg2.log.prefix = '[tg2] '

    await tg1.connect()
    await tg1.startUpdatesLoop()
    await tg2.connect()

    await t.step('should send and receive messages', async () => {
        const tg1Messages: Message[] = []

        tg1.on('new_message', msg => tg1Messages.push(msg))

        const [tg1User] = await tg1.getUsers('self')
        let username = tg1User!.username

        if (!username) {
            username = `mtcute_e2e_${Math.random().toString(36).slice(2)}`
            await tg1.setMyUsername(username)
        }

        const messageText = `mtcute test message ${Math.random().toString(36).slice(2)}`
        const sentMsg = await tg2.sendText(username, messageText)

        assertEquals(sentMsg.text, messageText)
        assertEquals(sentMsg.chat.id, tg1User!.id)

        await waitFor(() => {
            assertNotEquals(
                tg1Messages.find(msg => msg.text === messageText),
                undefined,
            )
        })
    })

    await tg1.close()
    await tg2.close()
})
