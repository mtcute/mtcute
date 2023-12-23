import { expect } from 'chai'
import { describe, it } from 'mocha'

import { MtUnsupportedError, TelegramClient } from '@mtcute/client'

import { getApiParams } from '../utils.js'

const getAccountId = () =>
    Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0')

describe('1. authorization', function () {
    this.timeout(300_000)

    it('should authorize in default dc', async () => {
        const tg = new TelegramClient(getApiParams('dc2.session'))

        // reset storage just in case
        await tg.storage.load?.()
        await tg.storage.reset(true)

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
        const tg = new TelegramClient(getApiParams('dc1.session'))

        // reset storage just in case
        await tg.storage.load?.()
        await tg.storage.reset(true)

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
