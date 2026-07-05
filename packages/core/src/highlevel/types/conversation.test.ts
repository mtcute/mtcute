import { createStub, StubTelegramClient } from '@mtcute/test'
import Long from 'long'
import { describe, expect, it } from 'vitest'

import { Conversation } from './conversation.js'

describe('Conversation', () => {
  const create = async () => {
    const client = new StubTelegramClient()
    client.respondWith('messages.getPeerDialogs', () =>
      createStub('messages.peerDialogs', { dialogs: [], messages: [], chats: [], users: [] }))
    await client.registerPeers(createStub('user', { id: 1, accessHash: Long.ZERO }))

    const conv = new Conversation(client, 1)
    await conv.start()

    return conv
  }

  it('should reject pending waiters with disabled timeout on stop', async () => {
    const conv = await create()

    const promise = conv.waitForNewMessage(undefined, null)
    const edit = conv.waitForEdit(undefined, { message: 5, timeout: null })

    conv.stop()

    await expect(promise).rejects.toThrow('Conversation stopped')
    await expect(edit).rejects.toThrow('Conversation stopped')
  })
})
