import { createStub, StubTelegramClient } from '@mtcute/test'
import Long from 'long'

import { describe, expect, it, vi } from 'vitest'

import { stopBotDraft } from './stop-bot-draft.js'

const stubBot = createStub('user', {
  id: 123123,
  accessHash: Long.fromBits(123, 456),
  bot: true,
})

describe('stopBotDraft', () => {
  it('should send stop draft action', async () => {
    const client = new StubTelegramClient()
    await client.registerPeers(stubBot)

    const call = vi.spyOn(client, 'call').mockResolvedValue(true as never)
    const draftId = Long.fromBits(1, 2)

    await stopBotDraft(client, stubBot.id, draftId, { threadId: 42 })

    expect(call).toHaveBeenCalledWith({
      _: 'messages.setTyping',
      peer: { _: 'inputPeerUser', userId: stubBot.id, accessHash: stubBot.accessHash },
      action: { _: 'sendMessageStopDraftAction', randomId: draftId },
      topMsgId: 42,
    })
  })
})
