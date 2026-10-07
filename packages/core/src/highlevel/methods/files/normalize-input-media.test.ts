import { StubTelegramClient } from '@mtcute/test'
import { describe, expect, it } from 'vitest'

import { InputMedia } from '../../types/media/input-media/index.js'
import { _normalizeInputMedia, _normalizeInputPollAnswer } from './normalize-input-media.js'

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

describe('_normalizeInputMedia', () => {
  it.each([
    ['geo', InputMedia.geo(1, 2, { accuracy: 50 })],
    ['geo_live', InputMedia.geoLive(1, 2, { accuracy: 50 })],
  ])('should pass accuracy for %s', async (_, media) => {
    const client = new StubTelegramClient()

    expect(await _normalizeInputMedia(client, media)).toMatchObject({
      geoPoint: { _: 'inputGeoPoint', lat: 1, long: 2, accuracyRadius: 50 },
    })
  })
})
