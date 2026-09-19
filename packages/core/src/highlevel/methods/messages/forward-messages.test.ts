import { createStub, StubTelegramClient } from '@mtcute/test'
import Long from 'long'
import { describe, expect, it } from 'vitest'

import { forwardMessagesById } from './forward-messages.js'

const stubUser = createStub('user', {
  id: 123123,
  accessHash: Long.fromBits(123, 456),
})

describe('forwardMessagesById', () => {
  it('should pass effect, suggested post and schedule repeat period', async () => {
    const client = new StubTelegramClient()

    await client.registerPeers(stubUser)

    client.respondWith('messages.forwardMessages', (req) => {
      expect(req.effect).toEqual(Long.fromNumber(5))
      expect(req.scheduleRepeatPeriod).toBe(86400)
      expect(req.suggestedPost).toEqual({
        _: 'suggestedPost',
        price: { _: 'starsTonAmount', amount: Long.fromNumber(1000) },
        scheduleDate: undefined,
      })

      return createStub('updates', {
        users: [stubUser],
        updates: [{
          _: 'updateNewMessage',
          pts: 0,
          ptsCount: 1,
          message: createStub('message', {
            id: 1,
            peerId: { _: 'peerUser', userId: stubUser.id },
          }),
        }],
      })
    })

    await client.with(async () => {
      const msgs = await forwardMessagesById(client, {
        toChatId: stubUser.id,
        fromChatId: stubUser.id,
        messages: [42],
        effect: Long.fromNumber(5),
        scheduleRepeatPeriod: 86400,
        suggestedPost: {
          price: { _: 'starsTonAmount', amount: Long.fromNumber(1000) },
        },
      })

      expect(msgs).toHaveLength(1)
    })
  })
})
