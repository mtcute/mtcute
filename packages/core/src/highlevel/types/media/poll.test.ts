import type { tl } from '../../../tl/index.js'
import Long from 'long'
import { describe, expect, it } from 'vitest'

import { PeersIndex } from '../peers/peers-index.js'
import { Poll } from './poll.js'

function createAnswer(text: string, option: number): tl.RawPollAnswer {
  return {
    _: 'pollAnswer',
    text: { _: 'textWithEntities', text, entities: [] },
    option: new Uint8Array([option]),
  }
}

function createPoll(params: Partial<tl.RawPoll> = {}): tl.RawPoll {
  return {
    _: 'poll',
    id: Long.ONE,
    question: { _: 'textWithEntities', text: 'question', entities: [] },
    answers: [createAnswer('a', 0), createAnswer('b', 1)],
    hash: Long.ZERO,
    ...params,
  }
}

describe('Poll', () => {
  it('should match answer results by option', () => {
    const poll = new Poll(createPoll(), new PeersIndex(), {
      _: 'pollResults',
      results: [
        { _: 'pollAnswerVoters', option: new Uint8Array([1]), voters: 5, chosen: true },
        { _: 'pollAnswerVoters', option: new Uint8Array([0]), voters: 2 },
      ],
    })

    expect(poll.answers.map(it => [it.text, it.voters, it.chosen])).toEqual([
      ['a', 2, false],
      ['b', 5, true],
    ])
  })

  it('should only allow adding answers to open polls', () => {
    expect(new Poll(createPoll(), new PeersIndex()).canAddAnswers).toBe(false)
    expect(new Poll(createPoll({ openAnswers: true }), new PeersIndex()).canAddAnswers).toBe(true)
    expect(new Poll(createPoll({ openAnswers: true, closed: true }), new PeersIndex()).canAddAnswers).toBe(false)
  })
})
