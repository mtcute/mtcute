import type { Message } from 'mtcute'
import { after, before, describe, it } from 'node:test'
import { asNonNull } from '@fuman/utils'
import { expect } from 'chai'

import { TelegramClient } from 'mtcute'
import { getApiParams, waitFor } from './_utils.js'

describe('4. handling updates', () => {
    const tg1 = new TelegramClient(getApiParams('dc1.session'))
    tg1.log.prefix = '[tg1] '
    const tg2 = new TelegramClient(getApiParams('dc2.session'))
    tg2.log.prefix = '[tg2] '

    before(async () => {
        await tg1.connect()
        await tg1.startUpdatesLoop()
        await tg2.connect()
    })
    after(async () => {
        await tg1.destroy()
        await tg2.destroy()
    })

    it('should send and receive messages', async () => {
        const tg1Messages: Message[] = []

        tg1.onNewMessage.add(msg => tg1Messages.push(msg))

        const [tg1User] = await tg1.getUsers('self')
        const username = asNonNull(tg1User!.username)

        const messageText = `mtcute test message ${Math.random().toString(36).slice(2)}`
        const sentMsg = await tg2.sendText(username, messageText)

        expect(sentMsg.text).to.equal(messageText)
        expect(sentMsg.chat.id).to.equal(tg1User!.id)

        await waitFor(() => {
            // eslint-disable-next-line ts/no-unused-expressions
            expect(tg1Messages.find(msg => msg.text === messageText)).to.exist
        })
    })
})
