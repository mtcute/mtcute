import { createStub, StubTelegramClient } from '@mtcute/test'
import Long from 'long'
import { beforeAll, describe, expect, it } from 'vitest'

import { getForumTopicsById } from './get-forum-topics-by-id.js'

describe('getForumTopicsById', () => {
  const client = new StubTelegramClient()

  client.respondWith('messages.getForumTopicsByID', ({ topics }) => ({
    _: 'messages.forumTopics' as const,
    count: topics.length,
    topics: topics.map((id) => {
      if (id >= 400) return { _: 'forumTopicDeleted' as const, id }

      return createStub('forumTopic', { id })
    }),
    messages: [],
    chats: [],
    users: [],
    pts: 0,
  }))

  beforeAll(async () => {
    await client.registerPeers(
      createStub('channel', {
        id: 123,
        accessHash: Long.fromBits(123, 456),
        forum: true,
      }),
    )
  })

  it('should return topics aligned with the input ids', async () => {
    const res = await getForumTopicsById(client, -1000000000123, [1, 2, 3])

    expect(res.map(it => it?.id ?? null)).toEqual([1, 2, 3])
  })

  it('should return null for deleted topics', async () => {
    const res = await getForumTopicsById(client, -1000000000123, [1, 404, 2, 405])

    expect(res.map(it => it?.id ?? null)).toEqual([1, null, 2, null])
  })

  it('should return null for a single deleted topic', async () => {
    const res = await getForumTopicsById(client, -1000000000123, 404)

    expect(res.map(it => it?.id ?? null)).toEqual([null])
  })
})
