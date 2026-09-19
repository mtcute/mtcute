import { createStub, StubTelegramClient } from '@mtcute/test'
import Long from 'long'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { readReactions } from './read-reactions.js'

describe('readReactions', () => {
  const client = new StubTelegramClient()

  client.respondWith('messages.readReactions', () => ({
    _: 'messages.affectedHistory' as const,
    pts: 10,
    ptsCount: 1,
    offset: 0,
  }))

  beforeAll(async () => {
    await client.registerPeers(
      createStub('channel', {
        id: 123,
        accessHash: Long.fromBits(123, 456),
      }),
      createStub('user', {
        id: 456,
        accessHash: Long.fromBits(456, 789),
      }),
    )
  })

  it('should pass channel id to the dummy update for channels', async () => {
    const spy = vi.spyOn(client, 'handleClientUpdate')

    await readReactions(client, -1000000000123)

    expect(spy).toHaveBeenCalledWith(expect.objectContaining({
      updates: [{ _: 'mtcute.dummyUpdate', channelId: 123, pts: 10, ptsCount: 1 }],
    }))
    spy.mockRestore()
  })

  it('should pass topic parameters', async () => {
    const fn = vi.fn()
    client.respondWith('messages.readReactions', (req) => {
      fn(req)

      return { _: 'messages.affectedHistory', pts: 10, ptsCount: 0, offset: 0 }
    })

    await readReactions(client, -1000000000123, { topicId: 5, topicPeer: 456 })

    expect(fn).toHaveBeenCalledWith(expect.objectContaining({
      topMsgId: 5,
      savedPeerId: { _: 'inputPeerUser', userId: 456, accessHash: Long.fromBits(456, 789) },
    }))
  })
})
