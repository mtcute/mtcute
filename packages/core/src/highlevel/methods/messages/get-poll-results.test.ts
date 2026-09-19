import { createStub, StubTelegramClient } from '@mtcute/test'
import Long from 'long'
import { describe, expect, it } from 'vitest'

import { PeersIndex, Poll } from '../../types/index.js'
import { getPollResults } from './get-poll-results.js'

const stubUser = createStub('user', {
  id: 123123,
  accessHash: Long.fromBits(123, 456),
})

const knownPoll = new Poll({
  _: 'poll',
  id: Long.ONE,
  question: { _: 'textWithEntities', text: 'question', entities: [] },
  answers: [{
    _: 'pollAnswer',
    text: { _: 'textWithEntities', text: 'a', entities: [] },
    option: new Uint8Array([0]),
  }],
  hash: Long.fromInt(42),
}, new PeersIndex())

describe('getPollResults', () => {
  it('should reuse the known poll if it was not modified', async () => {
    const client = new StubTelegramClient()

    await client.registerPeers(stubUser)

    client.respondWith('messages.getPollResults', (req) => {
      expect(req.pollHash).toEqual(Long.fromInt(42))

      return createStub('updates', {
        users: [stubUser],
        updates: [{
          _: 'updateMessagePoll',
          pollId: Long.ONE,
          results: {
            _: 'pollResults',
            results: [{ _: 'pollAnswerVoters', option: new Uint8Array([0]), voters: 3 }],
            totalVoters: 3,
          },
        }],
      })
    })

    await client.with(async () => {
      const poll = await getPollResults(client, {
        chatId: stubUser.id,
        message: 1,
        poll: knownPoll,
      })

      expect(poll.question).toBe('question')
      expect(poll.voters).toBe(3)
      expect(poll.answers[0].voters).toBe(3)
    })
  })

  it('should keep peers referenced by the known poll', async () => {
    const client = new StubTelegramClient()

    await client.registerPeers(stubUser)

    const pollWithAuthor = new Poll({
      ...knownPoll.raw,
      answers: [{
        _: 'pollAnswer',
        text: { _: 'textWithEntities', text: 'a', entities: [] },
        option: new Uint8Array([0]),
        addedBy: { _: 'peerUser', userId: stubUser.id },
        date: 1700000000,
      }],
    }, PeersIndex.from({ users: [stubUser] }))

    client.respondWith('messages.getPollResults', () => createStub('updates', {
      updates: [{
        _: 'updateMessagePoll',
        pollId: Long.ONE,
        results: { _: 'pollResults', totalVoters: 0 },
      }],
    }))

    await client.with(async () => {
      const poll = await getPollResults(client, {
        chatId: stubUser.id,
        message: 1,
        poll: pollWithAuthor,
      })

      expect(poll.answers[0].addedBy?.id).toBe(stubUser.id)
    })
  })
})
