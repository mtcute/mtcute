import type { tl } from '../../tl/index.js'
import type { TextWithEntities } from '../types/misc/entities.js'

import Long from 'long'
import { getMarkedPeerId } from '../../utils/peer-utils.js'

/**
 * Join multiple text parts with entities into a single text with entities,
 * adjusting the entities' offsets accordingly.
 *
 * @param parts  List of text parts with entities
 * @param delim  Delimiter to insert between parts
 * @returns  A single text with entities
 * @example
 *
 * ```ts
 * const scoreboardText = joinTextWithEntities(
 *   apiResult.scoreboard.map((entry) => html`<b>${entry.name}</b>: ${entry.score}`),
 *   html`<br>`
 * )
 * await tg.sendText(chatId, html`<b>scoreboard:</b><br><br>${scoreboardText}`)
 * ```
 */
export function joinTextWithEntities(
  parts: (string | TextWithEntities)[],
  delim: string | TextWithEntities = '',
): TextWithEntities {
  const textParts: string[] = []
  const newEntities: tl.TypeMessageEntity[] = []

  let position = 0

  if (typeof delim === 'string') {
    delim = { text: delim }
  }

  const pushPart = (part: TextWithEntities) => {
    textParts.push(part.text)
    const entitiesOffset = position
    position += part.text.length

    if (part.entities) {
      for (const entity of part.entities) {
        newEntities.push({
          ...entity,
          offset: entity.offset + entitiesOffset,
        })
      }
    }
  }

  for (const part of parts) {
    if (position > 0) {
      pushPart(delim)
    }

    pushPart(typeof part === 'string' ? { text: part } : part)
  }

  return {
    text: textParts.join(''),
    entities: newEntities,
  }
}

type RichTextWrapper = (inner: tl.TypeRichText) => tl.TypeRichText

function _entityToRichTextWrapper(entity: tl.TypeMessageEntity, text: string): RichTextWrapper | null {
  const covered = (): string => text.slice(entity.offset, entity.offset + entity.length)

  switch (entity._) {
    case 'messageEntityBold': return inner => ({ _: 'textBold', text: inner })
    case 'messageEntityItalic': return inner => ({ _: 'textItalic', text: inner })
    case 'messageEntityUnderline': return inner => ({ _: 'textUnderline', text: inner })
    case 'messageEntityStrike': return inner => ({ _: 'textStrike', text: inner })
    case 'messageEntityCode':
    case 'messageEntityPre': return inner => ({ _: 'textFixed', text: inner })
    case 'messageEntitySpoiler': return inner => ({ _: 'textSpoiler', text: inner })
    case 'messageEntityMention': return inner => ({ _: 'textMention', text: inner })
    case 'messageEntityHashtag': return inner => ({ _: 'textHashtag', text: inner })
    case 'messageEntityCashtag': return inner => ({ _: 'textCashtag', text: inner })
    case 'messageEntityBotCommand': return inner => ({ _: 'textBotCommand', text: inner })
    case 'messageEntityBankCard': return inner => ({ _: 'textBankCard', text: inner })
    case 'messageEntityUrl': return inner => ({ _: 'textUrl', text: inner, url: covered(), webpageId: Long.ZERO })
    case 'messageEntityTextUrl': return inner => ({ _: 'textUrl', text: inner, url: entity.url, webpageId: Long.ZERO })
    case 'messageEntityEmail': return inner => ({ _: 'textEmail', text: inner, email: covered() })
    case 'messageEntityPhone': return inner => ({ _: 'textPhone', text: inner, phone: covered() })
    case 'messageEntityMentionName': return inner => ({ _: 'textMentionName', text: inner, userId: entity.userId })
    case 'inputMessageEntityMentionName': return inner => ({ _: 'textMentionName', text: inner, userId: getMarkedPeerId(entity.userId) })
    case 'messageEntityCustomEmoji':
      // leaf node: custom emoji replaces its content
      return () => ({ _: 'textCustomEmoji', documentId: entity.documentId, alt: covered() })
    case 'messageEntityFormattedDate':
      return inner => ({
        _: 'textDate',
        text: inner,
        date: entity.date,
        relative: entity.relative,
        shortTime: entity.shortTime,
        longTime: entity.longTime,
        shortDate: entity.shortDate,
        longDate: entity.longDate,
        dayOfWeek: entity.dayOfWeek,
      })
    default:
      // blockquote, diff*, unknown — no rich text equivalent
      return null
  }
}

/**
 * Convert a {@link TextWithEntities} into a {@link tl.TypeRichText} tree
 * (as used in page blocks / instant view).
 *
 * Overlapping entities are handled by splitting the text at every entity
 * boundary and nesting the wrappers per-segment, so the result may be more
 * fragmented than the input, but always renders identically.
 */
export function textWithEntitiesToRichText(input: TextWithEntities): tl.TypeRichText {
  const { text, entities } = input

  if (!text) return { _: 'textEmpty' }
  if (!entities?.length) return { _: 'textPlain', text }

  const bounds = new Set<number>([0, text.length])
  for (const e of entities) {
    bounds.add(e.offset)
    bounds.add(e.offset + e.length)
  }
  const sorted = [...bounds].filter(b => b >= 0 && b <= text.length).sort((a, b) => a - b)

  const segments: tl.TypeRichText[] = []
  for (let i = 0; i < sorted.length - 1; i++) {
    const start = sorted[i]
    const end = sorted[i + 1]
    if (start === end) continue

    let node: tl.TypeRichText = { _: 'textPlain', text: text.slice(start, end) }

    // smallest entities applied first => they end up innermost
    const active = entities
      .filter(e => e.offset <= start && e.offset + e.length >= end)
      .sort((a, b) => a.length - b.length)

    for (const e of active) {
      const wrap = _entityToRichTextWrapper(e, text)
      if (wrap) node = wrap(node)
    }

    segments.push(node)
  }

  if (segments.length === 0) return { _: 'textEmpty' }
  if (segments.length === 1) return segments[0]
  return { _: 'textConcat', texts: segments }
}

function _richTextNodeToEntity(
  node: tl.TypeRichText,
  offset: number,
  length: number,
): tl.TypeMessageEntity | null {
  switch (node._) {
    case 'textBold': return { _: 'messageEntityBold', offset, length }
    case 'textItalic': return { _: 'messageEntityItalic', offset, length }
    case 'textUnderline': return { _: 'messageEntityUnderline', offset, length }
    case 'textStrike': return { _: 'messageEntityStrike', offset, length }
    case 'textFixed': return { _: 'messageEntityCode', offset, length }
    case 'textSpoiler': return { _: 'messageEntitySpoiler', offset, length }
    case 'textMention': return { _: 'messageEntityMention', offset, length }
    case 'textHashtag': return { _: 'messageEntityHashtag', offset, length }
    case 'textCashtag': return { _: 'messageEntityCashtag', offset, length }
    case 'textBotCommand': return { _: 'messageEntityBotCommand', offset, length }
    case 'textBankCard': return { _: 'messageEntityBankCard', offset, length }
    case 'textUrl': return { _: 'messageEntityTextUrl', offset, length, url: node.url }
    case 'textEmail': return { _: 'messageEntityEmail', offset, length }
    case 'textPhone': return { _: 'messageEntityPhone', offset, length }
    case 'textMentionName': return { _: 'messageEntityMentionName', offset, length, userId: node.userId }
    case 'textDate':
      return {
        _: 'messageEntityFormattedDate',
        offset,
        length,
        date: node.date,
        relative: node.relative,
        shortTime: node.shortTime,
        longTime: node.longTime,
        shortDate: node.shortDate,
        longDate: node.longDate,
        dayOfWeek: node.dayOfWeek,
      }
    default:
      // textMarked, textSubscript, textSuperscript, textAnchor, … — no entity equivalent
      return null
  }
}

/**
 * Convert a {@link tl.TypeRichText} tree back into a {@link TextWithEntities}.
 *
 * This conversion is **lossy**: rich text nodes that have no message entity
 * equivalent (e.g. `textMarked`, `textSubscript`, anchors, images) are dropped,
 * keeping only their textual content.
 */
export function richTextToTextWithEntities(rich: tl.TypeRichText): TextWithEntities {
  const entities: tl.TypeMessageEntity[] = []
  let text = ''

  const walk = (node: tl.TypeRichText): void => {
    switch (node._) {
      case 'textEmpty':
        return
      case 'textPlain':
        text += node.text
        return
      case 'textConcat':
        for (const t of node.texts) walk(t)
        return
      case 'textImage':
        // no textual representation
        return
      case 'textMath':
        text += node.source
        return
      case 'textCustomEmoji': {
        const start = text.length
        text += node.alt
        entities.push({
          _: 'messageEntityCustomEmoji',
          offset: start,
          length: text.length - start,
          documentId: node.documentId,
        })
        return
      }
      default: {
        const start = text.length
        walk(node.text)
        const entity = _richTextNodeToEntity(node, start, text.length - start)
        if (entity) entities.push(entity)
      }
    }
  }

  walk(rich)

  return { text, entities }
}
