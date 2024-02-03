import { expect } from 'chai'
import { describe, it } from 'mocha'

import { Message, TelegramClient } from '@mtcute/core'

import { getApiParams, waitFor } from '../utils.js'

describe('4. handling updates', async function () {
    this.timeout(300_000)

    const tg1 = new TelegramClient(getApiParams('dc1.session'))
    tg1.log.prefix = '[tg1] '
    const tg2 = new TelegramClient(getApiParams('dc2.session'))
    tg2.log.prefix = '[tg2] '

    this.beforeAll(async () => {
        await tg1.connect()
        await tg1.startUpdatesLoop()
        await tg2.connect()
    })
    this.afterAll(async () => {
        await tg1.close()
        await tg2.close()
    })

    it('should send and receive messages', async () => {
        const tg1Messages: Message[] = []

        tg1.on('new_message', (msg) => tg1Messages.push(msg))

        const [tg1User] = await tg1.getUsers('self')
        let username = tg1User!.username

        if (!username) {
            username = `mtcute_e2e_${Math.random().toString(36).slice(2)}`
            await tg1.setMyUsername(username)
        }

        const messageText = `mtcute test message ${Math.random().toString(36).slice(2)}`
        const sentMsg = await tg2.sendText(username, messageText)

        expect(sentMsg.text).to.equal(messageText)
        expect(sentMsg.chat.id).to.equal(tg1User!.id)

        await waitFor(() => {
            expect(tg1Messages.find((msg) => msg.text === messageText)).to.exist
        })
    })
})
