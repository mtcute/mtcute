import { expect } from 'chai'
import { describe, it } from 'mocha'

import { BaseTelegramClient, MtUnsupportedError, TelegramClient } from '@mtcute/core'

import { getApiParams } from '../utils.js'

const getAccountId = () =>
    Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0')

describe('1. authorization', function () {
    this.timeout(300_000)

    it('should authorize in default dc', async () => {
        const base = new BaseTelegramClient(getApiParams('dc2.session'))
        const tg = new TelegramClient({ client: base })

        // reset storage just in case
        await base.mt.storage.load()
        await base.storage.clear(true)

        while (true) {
            const phone = `999662${getAccountId()}`
            let user

            try {
                user = await tg.start({
                    phone,
                    code: () => '22222',
                })
            } catch (e) {
                if (e instanceof MtUnsupportedError && e.message.includes('Signup is no longer supported')) {
                    // retry with another number
                    continue
                } else throw e
            }

            await tg.close()

            expect(user.isSelf).to.be.true
            expect(user.phoneNumber).to.equal(phone)
            break
        }
    })

    it('should authorize in dc 1', async () => {
        const base = new BaseTelegramClient(getApiParams('dc1.session'))
        const tg = new TelegramClient({ client: base })

        // reset storage just in case
        await base.mt.storage.load()
        await base.mt.storage.clear(true)

        while (true) {
            const phone = `999661${getAccountId()}`
            let user

            try {
                user = await tg.start({
                    phone,
                    code: () => '11111',
                })
            } catch (e) {
                if (e instanceof MtUnsupportedError && e.message.includes('Signup is no longer supported')) {
                    // retry with another number
                    continue
                } else throw e
            }

            await tg.close()

            expect(user.isSelf).to.be.true
            expect(user.phoneNumber).to.equal(phone)
            break
        }
    })
})
