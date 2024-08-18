import { expect } from 'chai'
import { describe, it } from 'mocha'
import { MtPeerNotFoundError } from '@mtcute/core'
import { TelegramClient } from '@mtcute/core/client.js'

import { getApiParams } from '../utils.js'

describe('2. calling methods', function () {
    this.timeout(300_000)
    const tg = new TelegramClient(getApiParams('dc2.session'))

    this.beforeAll(() => tg.connect())
    this.afterAll(() => tg.close())

    it('getUsers(@BotFather)', async () => {
        const [user] = await tg.getUsers('botfather')

        expect(user?.isBot).to.eq(true)
        expect(user?.displayName).to.equal('BotFather')
    })

    it('getUsers(@BotFather) - cached', async () => {
        const [user] = await tg.getUsers('botfather')

        expect(user?.isBot).to.eq(true)
        expect(user?.displayName).to.equal('BotFather')
    })

    it('getHistory(777000)', async () => {
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

        expect(history[0].chat.chatType).to.equal('private')
        expect(history[0].chat.id).to.equal(777000)
        expect(history[0].chat.firstName).to.equal('Telegram')
    })

    it('updateProfile', async () => {
        const bio = `mtcute e2e ${new Date().toISOString()}`

        const oldSelf = await tg.getFullChat('self')
        const res = await tg.updateProfile({ bio })
        const newSelf = await tg.getFullChat('self')

        expect(res.isSelf).to.eq(true)
        expect(oldSelf.bio).to.not.equal(newSelf.bio)
        expect(newSelf.bio).to.equal(bio)
    })
})
