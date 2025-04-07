import { describe, it } from 'node:test'
import { expect } from 'chai'
import { TelegramClient, User } from 'mtcute'

import { getApiParams } from './_utils.js'

describe('1. authorization', () => {
    it('should authorize in default dc', async () => {
        const tg = new TelegramClient(getApiParams('dc2.session'))

        await tg.importSession(process.env.SESSION_DC2!, true)

        expect(await tg.getMe()).to.be.instanceOf(User)

        await tg.close()
    })

    it('should authorize in dc 1', async () => {
        const tg = new TelegramClient(getApiParams('dc1.session'))

        await tg.importSession(process.env.SESSION_DC1!, true)

        expect(await tg.getMe()).to.be.instanceOf(User)

        await tg.close()
    })
})
