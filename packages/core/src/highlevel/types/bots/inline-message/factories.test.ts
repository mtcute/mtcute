import { StubTelegramClient } from '@mtcute/test'
import { describe, expect, it } from 'vitest'

import { BotInlineMessage } from './index.js'

describe('_convertToTl', () => {
  it('should pass disableWebPreview for text messages', async () => {
    const client = new StubTelegramClient()

    const res = await BotInlineMessage._convertToTl(
      client,
      BotInlineMessage.text('https://example.com', { disableWebPreview: true }),
    )

    expect(res).toMatchObject({ _: 'inputBotInlineMessageText', noWebpage: true })
  })

  it('should pass accuracy for geo messages', async () => {
    const client = new StubTelegramClient()

    const res = await BotInlineMessage._convertToTl(
      client,
      BotInlineMessage.geo({ latitude: 1, longitude: 2, accuracy: 50 }),
    )

    expect(res).toMatchObject({ geoPoint: { _: 'inputGeoPoint', lat: 1, long: 2, accuracyRadius: 50 } })
  })
})
