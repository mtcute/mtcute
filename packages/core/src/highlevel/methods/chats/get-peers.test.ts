import { createStub, StubTelegramClient } from '@mtcute/test'
import Long from 'long'
import { beforeAll, describe, expect, it } from 'vitest'

import { Chat, User } from '../../types/index.js'

import { getPeers } from './get-peers.js'

describe('getPeers', () => {
  const client = new StubTelegramClient()

  client.respondWith('users.getUsers', ({ id }) =>
    id.map((it) => {
      if (it._ !== 'inputUser') throw new Error('unexpected')
      if (it.userId === 999) return createStub('userEmpty', { id: 999 })

      return createStub('user', { id: it.userId, accessHash: Long.ZERO })
    }))

  client.respondWith('channels.getChannels', ({ id }) => ({
    _: 'messages.chats' as const,
    chats: id.map((it) => {
      if (it._ !== 'inputChannel') throw new Error('unexpected')
      if (it.channelId === 999) return createStub('chatEmpty', { id: 999 })

      return createStub('channel', { id: it.channelId, accessHash: Long.ZERO })
    }),
  }))

  client.respondWith('messages.getChats', ({ id }) => ({
    _: 'messages.chats' as const,
    chats: id.map((chatId) => {
      if (chatId === 999) return createStub('chatEmpty', { id: 999 })
      return createStub('chat', { id: chatId })
    }),
  }))

  beforeAll(async () => {
    await client.registerPeers(
      createStub('user', {
        id: 123,
        accessHash: Long.fromBits(123, 456),
      }),
      createStub('channel', {
        id: 456,
        accessHash: Long.fromBits(123, 456),
      }),
      createStub('chat', { id: 789 }),
    )
  })

  it('should return users', async () => {
    expect(await getPeers(client, [123])).toEqual([
      new User(createStub('user', { id: 123, accessHash: Long.ZERO })),
    ])
  })

  it('should return channels', async () => {
    expect(await getPeers(client, [-1000000000456])).toEqual([
      new Chat(createStub('channel', { id: 456, accessHash: Long.ZERO })),
    ])
  })

  it('should return basic chats', async () => {
    expect(await getPeers(client, [-789])).toEqual([
      new Chat(createStub('chat', { id: 789 })),
    ])
  })

  it('should handle mixed peer types', async () => {
    expect(await getPeers(client, [123, -1000000000456, -789])).toEqual([
      new User(createStub('user', { id: 123, accessHash: Long.ZERO })),
      new Chat(createStub('channel', { id: 456, accessHash: Long.ZERO })),
      new Chat(createStub('chat', { id: 789 })),
    ])
  })

  it('should return null for unresolved peers', async () => {
    expect(await getPeers(client, [999, -999, -1000000000999])).toEqual([
      null,
      null,
      null,
    ])
  })
})
