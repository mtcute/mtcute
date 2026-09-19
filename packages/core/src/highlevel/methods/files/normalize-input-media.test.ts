import { StubTelegramClient } from '@mtcute/test'
import { describe, expect, it } from 'vitest'

import { _normalizeInputPollAnswer } from './normalize-input-media.js'

describe('_normalizeInputPollAnswer', () => {
  it('should keep entities of a text with entities', async () => {
    const client = new StubTelegramClient()
    const entities = [{ _: 'messageEntityBold' as const, offset: 0, length: 3 }]

    expect(await _normalizeInputPollAnswer(client, { text: 'foo', entities })).toEqual({
      _: 'inputPollAnswer',
      text: { _: 'textWithEntities', text: 'foo', entities },
    })
  })

  it('should normalize an answer with text with entities', async () => {
    const client = new StubTelegramClient()
    const entities = [{ _: 'messageEntityBold' as const, offset: 0, length: 3 }]

    expect(await _normalizeInputPollAnswer(client, { text: { text: 'foo', entities } })).toEqual({
      _: 'inputPollAnswer',
      text: { _: 'textWithEntities', text: 'foo', entities },
      media: undefined,
    })
  })
})
