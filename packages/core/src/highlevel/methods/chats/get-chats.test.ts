import { createStub, StubTelegramClient } from '@mtcute/test'
import Long from 'long'
import { beforeAll, describe, expect, it } from 'vitest'

import { Chat } from '../../types/index.js'

import { getChats } from './get-chats.js'

describe('getChats', () => {
  const client = new StubTelegramClient()

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
      if (chatId === 1) return createStub('chatEmpty', { id: 1 })

      return createStub('chat', { id: chatId })
    }),
  }))

  beforeAll(async () => {
    await client.registerPeers(
      createStub('channel', {
        id: 123,
        accessHash: Long.fromBits(123, 456),
      }),
      createStub('channel', {
        id: 456,
        accessHash: Long.fromBits(123, 456),
      }),
      createStub('channel', {
        id: 1,
        accessHash: Long.fromBits(1, 1),
      }),
      createStub('chat', { id: 789 }),
      createStub('chat', { id: 1 }),
    )
  })

  it('should return channels', async () => {
    expect(await getChats(client, [-1000000000123, -1000000000456])).toEqual([
      new Chat(createStub('channel', { id: 123, accessHash: Long.ZERO })),
      new Chat(createStub('channel', { id: 456, accessHash: Long.ZERO })),
    ])
  })

  it('should return basic chats', async () => {
    expect(await getChats(client, [-789])).toEqual([
      new Chat(createStub('chat', { id: 789 })),
    ])
  })

  it('should handle mixed chat types', async () => {
    expect(await getChats(client, [-1000000000123, -789])).toEqual([
      new Chat(createStub('channel', { id: 123, accessHash: Long.ZERO })),
      new Chat(createStub('chat', { id: 789 })),
    ])
  })

  it('should return null for chatEmpty', async () => {
    expect(await getChats(client, [-1])).toEqual([null])
  })

  it('should return null for unresolved peers', async () => {
    expect(await getChats(client, [-1000000000999])).toEqual([null])
  })
})
