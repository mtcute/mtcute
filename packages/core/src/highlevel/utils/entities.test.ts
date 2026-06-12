import type { tl } from '../../tl/index.js'
import Long from 'long'
import { describe, expect, it } from 'vitest'

import { joinTextWithEntities, richTextToTextWithEntities, textWithEntitiesToRichText } from './entities.js'

function createEntity(offset: number, length: number): tl.TypeMessageEntity {
  return {
    _: 'messageEntityBold',
    offset,
    length,
  }
}

describe('joinTextWithEntities', () => {
  it('should join text with entities using a string delimiter', () => {
    expect(
      joinTextWithEntities(
        [
          { text: 'foo bar baz', entities: [createEntity(0, 3), createEntity(4, 3), createEntity(8, 3)] },
          { text: 'egg spam', entities: [createEntity(4, 4)] },
          { text: 'very spam', entities: [createEntity(0, 4)] },
        ],
        ' 🚀 ',
      ),
    ).toEqual({
      text: 'foo bar baz 🚀 egg spam 🚀 very spam',
      entities: [
        createEntity(0, 3),
        createEntity(4, 3),
        createEntity(8, 3),
        createEntity(19, 4),
        createEntity(27, 4),
      ],
    })
  })

  it('should join text with entities using a TextWithEntities delimiter', () => {
    expect(
      joinTextWithEntities(
        [
          { text: 'foo bar baz', entities: [createEntity(0, 3), createEntity(4, 3), createEntity(8, 3)] },
          { text: 'egg spam', entities: [createEntity(4, 4)] },
          { text: 'very spam', entities: [createEntity(0, 4)] },
        ],
        { text: ' 🚀 ', entities: [createEntity(1, 2)] },
      ),
    ).toEqual({
      text: 'foo bar baz 🚀 egg spam 🚀 very spam',
      entities: [
        createEntity(0, 3),
        createEntity(4, 3),
        createEntity(8, 3),
        createEntity(12, 2),
        createEntity(19, 4),
        createEntity(24, 2),
        createEntity(27, 4),
      ],
    })
  })
})

describe('textWithEntitiesToRichText', () => {
  it('should return textEmpty for empty text', () => {
    expect(textWithEntitiesToRichText({ text: '' })).toEqual({ _: 'textEmpty' })
  })

  it('should return textPlain when there are no entities', () => {
    expect(textWithEntitiesToRichText({ text: 'hello' })).toEqual({ _: 'textPlain', text: 'hello' })
  })

  it('should wrap a single entity', () => {
    expect(
      textWithEntitiesToRichText({ text: 'hello', entities: [createEntity(0, 5)] }),
    ).toEqual({ _: 'textBold', text: { _: 'textPlain', text: 'hello' } })
  })

  it('should concat segments around an entity', () => {
    expect(
      textWithEntitiesToRichText({ text: 'foo bar', entities: [createEntity(4, 3)] }),
    ).toEqual({
      _: 'textConcat',
      texts: [
        { _: 'textPlain', text: 'foo ' },
        { _: 'textBold', text: { _: 'textPlain', text: 'bar' } },
      ],
    })
  })

  it('should nest overlapping entities with the smaller one innermost', () => {
    expect(
      textWithEntitiesToRichText({
        text: 'hello world',
        entities: [
          { _: 'messageEntityBold', offset: 0, length: 11 },
          { _: 'messageEntityItalic', offset: 6, length: 5 },
        ],
      }),
    ).toEqual({
      _: 'textConcat',
      texts: [
        { _: 'textBold', text: { _: 'textPlain', text: 'hello ' } },
        { _: 'textBold', text: { _: 'textItalic', text: { _: 'textPlain', text: 'world' } } },
      ],
    })
  })

  it('should fill url-like entity values from covered text', () => {
    expect(
      textWithEntitiesToRichText({
        text: 'a@b.com',
        entities: [{ _: 'messageEntityEmail', offset: 0, length: 7 }],
      }),
    ).toEqual({ _: 'textEmail', text: { _: 'textPlain', text: 'a@b.com' }, email: 'a@b.com' })
  })

  it('should use the explicit url of textUrl entities', () => {
    expect(
      textWithEntitiesToRichText({
        text: 'click',
        entities: [{ _: 'messageEntityTextUrl', offset: 0, length: 5, url: 'https://example.com' }],
      }),
    ).toEqual({
      _: 'textUrl',
      text: { _: 'textPlain', text: 'click' },
      url: 'https://example.com',
      webpageId: Long.ZERO,
    })
  })

  it('should turn custom emoji into a leaf node', () => {
    expect(
      textWithEntitiesToRichText({
        text: '🌭',
        entities: [{ _: 'messageEntityCustomEmoji', offset: 0, length: 2, documentId: Long.fromInt(42) }],
      }),
    ).toEqual({ _: 'textCustomEmoji', documentId: Long.fromInt(42), alt: '🌭' })
  })

  it('should ignore entities without a rich text equivalent', () => {
    expect(
      textWithEntitiesToRichText({
        text: 'quote',
        entities: [{ _: 'messageEntityBlockquote', offset: 0, length: 5 }],
      }),
    ).toEqual({ _: 'textPlain', text: 'quote' })
  })
})

describe('richTextToTextWithEntities', () => {
  it('should handle textEmpty/textPlain', () => {
    expect(richTextToTextWithEntities({ _: 'textEmpty' })).toEqual({ text: '', entities: [] })
    expect(richTextToTextWithEntities({ _: 'textPlain', text: 'hi' })).toEqual({ text: 'hi', entities: [] })
  })

  it('should flatten a nested tree into entities', () => {
    expect(
      richTextToTextWithEntities({
        _: 'textConcat',
        texts: [
          { _: 'textPlain', text: 'foo ' },
          { _: 'textBold', text: { _: 'textItalic', text: { _: 'textPlain', text: 'bar' } } },
        ],
      }),
    ).toEqual({
      text: 'foo bar',
      entities: [
        { _: 'messageEntityItalic', offset: 4, length: 3 },
        { _: 'messageEntityBold', offset: 4, length: 3 },
      ],
    })
  })

  it('should keep text but drop nodes without an entity equivalent', () => {
    expect(
      richTextToTextWithEntities({ _: 'textMarked', text: { _: 'textPlain', text: 'mark' } }),
    ).toEqual({ text: 'mark', entities: [] })
    expect(
      richTextToTextWithEntities({ _: 'textAnchor', text: { _: 'textPlain', text: 'a' }, name: 'x' }),
    ).toEqual({ text: 'a', entities: [] })
  })

  it('should drop images and emit custom emoji alt text', () => {
    expect(
      richTextToTextWithEntities({
        _: 'textConcat',
        texts: [
          { _: 'textImage', documentId: Long.ZERO, w: 1, h: 1 },
          { _: 'textCustomEmoji', documentId: Long.fromInt(42), alt: '🌭' },
        ],
      }),
    ).toEqual({
      text: '🌭',
      entities: [{ _: 'messageEntityCustomEmoji', offset: 0, length: 2, documentId: Long.fromInt(42) }],
    })
  })

  it('should preserve textUrl url', () => {
    expect(
      richTextToTextWithEntities({
        _: 'textUrl',
        text: { _: 'textPlain', text: 'click' },
        url: 'https://example.com',
        webpageId: Long.ZERO,
      }),
    ).toEqual({
      text: 'click',
      entities: [{ _: 'messageEntityTextUrl', offset: 0, length: 5, url: 'https://example.com' }],
    })
  })

  it('should roundtrip a non-overlapping styled text', () => {
    const input = {
      text: 'foo bar baz',
      entities: [
        createEntity(0, 3),
        { _: 'messageEntityItalic', offset: 8, length: 3 } as tl.TypeMessageEntity,
      ],
    }

    const back = richTextToTextWithEntities(textWithEntitiesToRichText(input))
    expect(back.text).toEqual(input.text)
    expect(back.entities).toEqual(input.entities)
  })
})
