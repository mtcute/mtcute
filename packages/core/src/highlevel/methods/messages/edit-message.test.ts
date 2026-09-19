import { createStub, StubTelegramClient } from '@mtcute/test'
import Long from 'long'
import { describe, expect, it } from 'vitest'

import { editMessage } from './edit-message.js'

const stubUser = createStub('user', {
  id: 123123,
  accessHash: Long.fromBits(123, 456),
})

describe('editMessage', () => {
  it('should normalize rich messages', async () => {
    const client = new StubTelegramClient()

    await client.registerPeers(stubUser)

    client.respondWith('messages.editMessage', (req) => {
      expect(req.richMessage).toEqual({
        _: 'inputRichMessageMarkdown',
        markdown: '**edited**',
      })

      return createStub('updates', {
        users: [stubUser],
        updates: [{
          _: 'updateEditMessage',
          pts: 0,
          ptsCount: 1,
          message: createStub('message', {
            id: req.id,
            message: '',
            peerId: { _: 'peerUser', userId: stubUser.id },
          }),
        }],
      })
    })

    await client.with(async () => {
      const message = await editMessage(client, {
        chatId: stubUser.id,
        message: 42,
        richMessage: { type: 'markdown', content: '**edited**' },
      })

      expect(message.id).toBe(42)
    })
  })

  it('should pass schedule date and repeat period', async () => {
    const client = new StubTelegramClient()

    await client.registerPeers(stubUser)

    client.respondWith('messages.editMessage', (req) => {
      expect(req.scheduleDate).toBe(1700000000)
      expect(req.scheduleRepeatPeriod).toBe(86400)

      return createStub('updates', {
        users: [stubUser],
        updates: [{
          _: 'updateNewScheduledMessage',
          message: createStub('message', {
            id: req.id,
            peerId: { _: 'peerUser', userId: stubUser.id },
          }),
        }],
      })
    })

    await client.with(async () => {
      const message = await editMessage(client, {
        chatId: stubUser.id,
        message: 42,
        scheduleDate: new Date(1700000000_000),
        scheduleRepeatPeriod: 86400,
      })

      expect(message.id).toBe(42)
      expect(message.isScheduled).toBe(true)
    })
  })
})
