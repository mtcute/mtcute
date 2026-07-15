import type { Chat } from '../../types/index.js'
import { createStub, StubTelegramClient } from '@mtcute/test'
import Long from 'long'

import { describe, expect, it } from 'vitest'

import { toggleChannelIdMark } from '../../../utils/peer-utils.js'
import { sendText } from './send-text.js'

const stubUser = createStub('user', {
  id: 123123,
  accessHash: Long.fromBits(123, 456),
})
const stubChannel = createStub('channel', {
  id: 444222,
  accessHash: Long.fromBits(666, 777),
  megagroup: true,
})

describe('sendText', () => {
  it('should correctly handle updateNewMessage', async () => {
    const client = new StubTelegramClient()

    await client.registerPeers(stubUser)

    client.respondWith('messages.sendMessage', req =>
      createStub('updates', {
        users: [stubUser],
        updates: [
          {
            _: 'updateMessageID',
            randomId: req.randomId,
            id: 123,
          },
          {
            _: 'updateNewMessage',
            pts: 0,
            ptsCount: 1,
            message: createStub('message', {
              id: 123,
              message: req.message,
              peerId: {
                _: 'peerUser',
                userId: stubUser.id,
              },
            }),
          },
        ],
      }))

    await client.with(async () => {
      const msg = await sendText(client, stubUser.id, 'test')

      expect(msg).toBeDefined()
      expect(msg.id).toEqual(123)
      expect(msg.chat.type).toEqual('user')
      expect(msg.chat.id).toEqual(stubUser.id)
      expect(msg.text).toEqual('test')
    })
  })

  it('should correctly handle updateNewChannelMessage', async () => {
    const client = new StubTelegramClient()

    await client.registerPeers(stubChannel, stubUser)

    client.respondWith('messages.sendMessage', req =>
      createStub('updates', {
        users: [stubUser],
        chats: [stubChannel],
        updates: [
          {
            _: 'updateMessageID',
            randomId: req.randomId,
            id: 123,
          },
          {
            _: 'updateNewChannelMessage',
            pts: 0,
            ptsCount: 1,
            message: createStub('message', {
              id: 123,
              message: req.message,
              peerId: {
                _: 'peerChannel',
                channelId: stubChannel.id,
              },
            }),
          },
        ],
      }))

    await client.with(async () => {
      const markedChannelId = toggleChannelIdMark(stubChannel.id)

      const msg = await sendText(client, markedChannelId, 'test')

      expect(msg).toBeDefined()
      expect(msg.id).toEqual(123)
      expect(msg.chat.type).toEqual('chat')
      expect((msg.chat as Chat).chatType).toEqual('supergroup')
      expect(msg.chat.id).toEqual(markedChannelId)
      expect(msg.text).toEqual('test')
    })
  })

  it('should correctly handle updateShortSentMessage', async () => {
    const client = new StubTelegramClient()

    await client.storage.self.store({
      userId: stubUser.id,
      isBot: false,
      isPremium: false,
      usernames: [],
    })
    await client.registerPeers(stubUser)

    client.respondWith('messages.sendMessage', () =>
      createStub('updateShortSentMessage', {
        id: 123,
        out: true,
      }))

    await client.with(async () => {
      const msg = await sendText(client, stubUser.id, 'test')

      expect(msg).toBeDefined()
      expect(msg.id).toEqual(123)
      expect(msg.chat.type).toEqual('user')
      expect(msg.chat.id).toEqual(stubUser.id)
      expect(msg.text).toEqual('test')
    })
  })

  it('should carry over fields from the request into updateShortSentMessage', async () => {
    const client = new StubTelegramClient()

    await client.storage.self.store({
      userId: stubUser.id,
      isBot: false,
      isPremium: false,
      usernames: [],
    })
    await client.registerPeers(stubUser)

    client.respondWith('messages.sendMessage', () =>
      createStub('updateShortSentMessage', {
        id: 123,
        out: true,
        ttlPeriod: 86400,
        media: { _: 'messageMediaWebPage', webpage: { _: 'webPageEmpty', id: Long.ZERO } },
      }))

    await client.with(async () => {
      const msg = await sendText(client, stubUser.id, 'test', {
        replyTo: 42,
        quote: { text: 'quoted' },
        quoteOffset: 4,
        silent: true,
        forbidForwards: true,
        invertMedia: true,
        effect: Long.fromInt(789),
      })

      expect(msg.raw).toMatchObject({
        id: 123,
        out: true,
        silent: true,
        noforwards: true,
        invertMedia: true,
        effect: Long.fromInt(789),
        ttlPeriod: 86400,
        media: { _: 'messageMediaWebPage' },
        replyTo: {
          _: 'messageReplyHeader',
          replyToMsgId: 42,
          quote: true,
          quoteText: 'quoted',
          quoteOffset: 4,
        },
      })
    })
  })

  it('should derive forumTopic flag for forum channels', async () => {
    const client = new StubTelegramClient()

    const stubForum = createStub('channel', {
      id: 555333,
      accessHash: Long.fromBits(111, 222),
      megagroup: true,
      forum: true,
    })

    await client.storage.self.store({
      userId: stubUser.id,
      isBot: false,
      isPremium: false,
      usernames: [],
    })
    await client.registerPeers(stubForum, stubUser)

    client.respondWith('messages.sendMessage', () =>
      createStub('updateShortSentMessage', {
        id: 123,
        out: true,
      }))

    await client.with(async () => {
      const msg = await sendText(client, toggleChannelIdMark(stubForum.id), 'test', {
        replyTo: 42,
        threadId: 10,
      })

      expect(msg.raw.replyTo).toMatchObject({
        _: 'messageReplyHeader',
        replyToMsgId: 42,
        replyToTopId: 10,
        forumTopic: true,
      })
    })
  })
})
