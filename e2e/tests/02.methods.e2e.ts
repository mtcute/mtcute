import { after, before, describe, it } from 'node:test'
import { expect } from 'chai'
import { TelegramClient } from 'mtcute'

import { getApiParams } from './_utils.js'

describe('2. calling methods', () => {
  const tg = new TelegramClient(getApiParams('dc2.session'))

  before(() => tg.connect())
  after(() => tg.destroy())

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
    await tg.findDialogs(777000) // ensure it's cached

    const history = await tg.getHistory(777000, { limit: 5 })

    expect(history[0].chat.type).to.equal('user')
    expect(history[0].chat.id).to.equal(777000)
    expect(history[0].chat.displayName).to.match(/^Telegram(?: Notifications)?$/)
  })
})
