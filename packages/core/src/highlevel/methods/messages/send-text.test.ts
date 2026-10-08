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

  it('should derive forumTopic flag for private threaded chats', async () => {
    const client = new StubTelegramClient()

    await client.storage.self.store({
      userId: stubUser.id,
      isBot: true,
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
      // bot sends into a private threaded-mode topic (canonical user-space thread id)
      const msg = await sendText(client, stubUser.id, 'test', {
        threadId: 96179,
      })

      expect(msg.raw.replyTo).toMatchObject({
        _: 'messageReplyHeader',
        replyToMsgId: 96179,
        replyToTopId: 96179,
        forumTopic: true,
      })
      expect(msg.isTopicMessage).toEqual(true)
    })
  })

  it('should not set forumTopic for plain replies in private chats', async () => {
    const client = new StubTelegramClient()

    await client.storage.self.store({
      userId: stubUser.id,
      isBot: true,
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
      // plain reply (no threadId) — must NOT be flagged as a topic message
      const msg = await sendText(client, stubUser.id, 'test', {
        replyTo: 42,
      })

      expect(msg.raw.replyTo).toMatchObject({
        _: 'messageReplyHeader',
        replyToMsgId: 42,
      })
      expect(msg.raw.replyTo && 'forumTopic' in msg.raw.replyTo && msg.raw.replyTo.forumTopic).toBeFalsy()
      // getter reads `raw.replyTo.forumTopic!` — undefined (not false) when the flag is absent
      expect(msg.isTopicMessage).toBeFalsy()
    })
  })

  it('should not set forumTopic for threads between two users', async () => {
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
      // neither party is a bot — a thread in a user-to-user DM is not a forum topic
      const msg = await sendText(client, stubUser.id, 'test', {
        threadId: 42,
      })

      expect(msg.raw.replyTo).toMatchObject({
        _: 'messageReplyHeader',
        replyToMsgId: 42,
        replyToTopId: 42,
      })
      expect(msg.raw.replyTo && 'forumTopic' in msg.raw.replyTo && msg.raw.replyTo.forumTopic).toBeFalsy()
      expect(msg.isTopicMessage).toBeFalsy()
    })
  })

  it('should derive forumTopic flag when the peer is a bot (userbot sending into a bot forum)', async () => {
    const client = new StubTelegramClient()

    const stubBotUser = createStub('user', {
      id: 7713244205,
      accessHash: Long.fromBits(222, 333),
      bot: true,
    })

    await client.storage.self.store({
      userId: stubUser.id,
      isBot: false,
      isPremium: false,
      usernames: [],
    })
    await client.registerPeers(stubUser, stubBotUser)

    client.respondWith('messages.sendMessage', () =>
      createStub('updateShortSentMessage', {
        id: 123,
        out: true,
      }))

    await client.with(async () => {
      // userbot sends into a threaded-mode topic of a bot's DM chat
      const msg = await sendText(client, stubBotUser.id, 'test', {
        threadId: 96179,
      })

      expect(msg.raw.replyTo).toMatchObject({
        _: 'messageReplyHeader',
        replyToMsgId: 96179,
        replyToTopId: 96179,
        forumTopic: true,
      })
      expect(msg.isTopicMessage).toEqual(true)
    })
  })

  it('should pass suggested post and schedule repeat period', async () => {
    const client = new StubTelegramClient()

    await client.registerPeers(stubUser)

    client.respondWith('messages.sendMessage', (req) => {
      expect(req.scheduleDate).toBe(1700000000)
      expect(req.scheduleRepeatPeriod).toBe(86400)
      expect(req.suggestedPost).toEqual({
        _: 'suggestedPost',
        price: { _: 'starsAmount', amount: Long.fromNumber(100), nanos: 0 },
        scheduleDate: 1700001000,
      })

      return createStub('updates', {
        users: [stubUser],
        updates: [
          {
            _: 'updateMessageID',
            randomId: req.randomId,
            id: 123,
          },
          {
            _: 'updateNewScheduledMessage',
            message: createStub('message', {
              id: 123,
              message: req.message,
              peerId: { _: 'peerUser', userId: stubUser.id },
            }),
          },
        ],
      })
    })

    await client.with(async () => {
      const msg = await sendText(client, stubUser.id, 'test', {
        schedule: new Date(1700000000_000),
        scheduleRepeatPeriod: 86400,
        suggestedPost: {
          price: 100,
          scheduleDate: new Date(1700001000_000),
        },
      })

      expect(msg.id).toEqual(123)
    })
  })
})
