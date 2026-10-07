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
})
