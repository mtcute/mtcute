import type { InputText, MessageEntity, TextWithEntities, tl } from '@mtcute/core'
import Long from 'long'

const MENTION_REGEX = /^tg:\/\/user\?id=(\d+)(?:&hash=(-?[0-9a-fA-F]+)(?:&|$)|&|$)/
const EMOJI_REGEX = /^tg:\/\/emoji\?id=(-?\d+)/

const TAG_BOLD = '**'
const TAG_ITALIC = '__'
const TAG_UNDERLINE = '--'
const TAG_STRIKE = '~~'
const TAG_SPOILER = '||'
const TAG_CODE = '`'
const TAG_PRE = '```'

const TO_BE_ESCAPED = /[*_\-~`[\\\]|]/g

/**
 * Escape a string to be safely used in Markdown.
 *
 * > **Note**: this function is in most cases not needed, as `md` function
 * > handles all `string`s passed to it automatically as plain text.
 */
function escape(str: string): string {
  return str.replace(TO_BE_ESCAPED, s => `\\${s}`)
}

/**
 * Add Markdown formatting to the text given the plain text and entities contained in it.
 */
function unparse(input: InputText): string {
  if (typeof input === 'string') return escape(input)

  let text = input.text
  const entities = input.entities ?? []

  // keep track of positions of inserted escape symbols
  const escaped: number[] = []
  text = text.replace(TO_BE_ESCAPED, (s, pos: number) => {
    escaped.push(pos)

    return `\\${s}`
  })
  const hasEscaped = escaped.length > 0

  type InsertLater = [number, string]
  const insert: InsertLater[] = []

  for (const entity of entities) {
    const type = entity._

    let start = entity.offset
    let end = start + entity.length

    if (start > text.length) continue
    if (start < 0) start = 0
    if (end > text.length) end = text.length

    if (hasEscaped) {
      // determine number of escape chars since the beginning of the string
      let escapedPos = 0

      while (escapedPos < escaped.length && escaped[escapedPos] < start) {
        escapedPos += 1
      }
      start += escapedPos

      while (escapedPos < escaped.length && escaped[escapedPos] <= end) {
        escapedPos += 1
      }
      end += escapedPos
    }

    let startTag
    let endTag: string

    switch (type) {
      case 'messageEntityBold':
        startTag = endTag = TAG_BOLD
        break
      case 'messageEntityItalic':
        startTag = endTag = TAG_ITALIC
        break
      case 'messageEntityUnderline':
        startTag = endTag = TAG_UNDERLINE
        break
      case 'messageEntityStrike':
        startTag = endTag = TAG_STRIKE
        break
      case 'messageEntitySpoiler':
        startTag = endTag = TAG_SPOILER
        break
      case 'messageEntityCode':
        startTag = endTag = TAG_CODE
        break
      case 'messageEntityPre':
        startTag = TAG_PRE

        if (entity.language) {
          startTag += entity.language
        }

        startTag += '\n'
        endTag = `\n${TAG_PRE}`
        break
      case 'messageEntityTextUrl':
        startTag = '['
        endTag = `](${entity.url})`
        break
      case 'messageEntityMentionName':
        startTag = '['
        endTag = `](tg://user?id=${entity.userId})`
        break
      case 'messageEntityCustomEmoji':
        startTag = '['
        endTag = `](tg://emoji?id=${entity.documentId.toString()})`
        break
      default:
        continue
    }

    insert.push([start, startTag])
    insert.push([end, endTag])
  }

  // sort by offset desc
  insert.sort((a, b) => b[0] - a[0])

  for (const [offset, tag] of insert) {
    text = text.substr(0, offset) + tag + text.substr(offset)
  }

  return text
}

function parse(
  strings: TemplateStringsArray | string,
  ...sub: (InputText | MessageEntity | Long | boolean | number | undefined | null)[]
): TextWithEntities {
  const entities: tl.TypeMessageEntity[] = []
  let result = ''

  const stacks: Record<string, tl.Mutable<tl.TypeMessageEntity>[]> = {}

  let insideCode = false
  let insidePre = false
  let insideLink = false
  let currentBlockquoteStart: number | null = null
  let prevBlockquote: tl.Mutable<tl.RawMessageEntityBlockquote> | null = null

  let insideLinkUrl = false
  let pendingLinkUrl = ''

  function feed(text: string) {
    const len = text.length
    let pos = 0

    while (pos < len) {
      const c = text[pos]

      if (c === '\\') {
        if (insideLinkUrl) {
          pendingLinkUrl += text[pos + 1]
        } else {
          result += text[pos + 1]
        }
        pos += 2
        continue
      }

      if (insideCode) {
        if (c === '`') {
          // we can be certain that we're inside code

          const ent = stacks.code.pop()!
          ent.length = result.length - ent.offset
          entities.push(ent)
          insideCode = false
          pos += 1
        } else {
          pos += 1
          result += c
        }
        continue
      }

      if (insidePre) {
        if (c === '`' || (c === '\n' && text[pos + 1] === '`')) {
          if (c === '\n') pos += 1

          if (text[pos + 1] === '`' && text[pos + 2] === '`') {
            // we can be certain that we're inside pre

            const ent = stacks.pre.pop()!
            ent.length = result.length - ent.offset
            entities.push(ent)
            insidePre = false
            pos += 3
            continue

            // closed with single or double backtick
            // i.e. not closed actually! this is totally valid md:
            // ```javascript
            // const a = ``;
            // ```
            // compensate that `pos` change we made earliers
          } else if (c === '\n') {
            pos -= 1
          }
        }

        pos += 1
        result += c
        continue
      }

      if (insideLink && c === ']') {
        // we can be certain that we're inside link

        const ent = stacks.link.pop()!

        if (text[pos + 1] !== '(') {
          // [link text]
          // ignore this, and add opening [
          result = `${result.substr(0, ent.offset)}[${result.substr(ent.offset)}]`
          pos += 1
          insideLink = false
          continue
        }

        pos += 2
        insideLink = false
        insideLinkUrl = true
        stacks.link.push(ent)
        continue
      }

      if (insideLinkUrl) {
        pos += 1

        if (c !== ')') {
          // not ended yet
          pendingLinkUrl += c
          continue
        }

        const ent = stacks.link.pop()!

        let url = pendingLinkUrl
        pendingLinkUrl = ''
        insideLinkUrl = false

        if (!url.length) continue

        ent.length = result.length - ent.offset

        let m = url.match(MENTION_REGEX)

        if (m) {
          const userId = Number.parseInt(m[1])
          const accessHash = m[2]

          if (accessHash) {
            (ent as tl.Mutable<tl.RawInputMessageEntityMentionName>)._ = 'inputMessageEntityMentionName'
            ;(ent as tl.Mutable<tl.RawInputMessageEntityMentionName>).userId = {
              _: 'inputUser',
              userId,
              accessHash: Long.fromString(accessHash, false, 16),
            }
          } else {
            (ent as tl.Mutable<tl.RawMessageEntityMentionName>)._ = 'messageEntityMentionName'
            ;(ent as tl.Mutable<tl.RawMessageEntityMentionName>).userId = userId
          }
        } else if ((m = EMOJI_REGEX.exec(url))) {
          (ent as tl.Mutable<tl.RawMessageEntityCustomEmoji>)._ = 'messageEntityCustomEmoji'
          ;(ent as tl.Mutable<tl.RawMessageEntityCustomEmoji>).documentId = Long.fromString(m[1])
        } else {
          if (url.match(/^\/\//)) url = `http:${url}`
          ;(ent as tl.Mutable<tl.RawMessageEntityTextUrl>)._ = 'messageEntityTextUrl'
          ;(ent as tl.Mutable<tl.RawMessageEntityTextUrl>).url = url
        }
        entities.push(ent)

        continue
      }

      if (c === '[' && !insideLink) {
        pos += 1
        insideLink = true
        if (!('link' in stacks)) stacks.link = []
        // eslint-disable-next-line ts/no-unsafe-argument
        stacks.link.push({
          offset: result.length,
          length: 0,
        } as any) // other fields are added after the second part
        continue
      }

      if (c === '`') {
        const isPre = text[pos + 1] === '`' && text[pos + 2] === '`'

        if (isPre) {
          pos += 3
          let language = ''

          while (pos < text.length && text[pos] !== '\n') {
            language += text[pos++]
          }

          // newline
          pos += 1

          if (pos > text.length) {
            // malformed pre entity, treat as plain text
            result += '```'
            feed(language)
          } else {
            if (!('pre' in stacks)) stacks.pre = []
            stacks.pre.push({
              _: 'messageEntityPre',
              offset: result.length,
              length: 0,
              language,
            })
            insidePre = true
          }
        } else {
          pos += 1
          if (!('code' in stacks)) stacks.code = []
          stacks.code.push({
            _: 'messageEntityCode',
            offset: result.length,
            length: 0,
          })
          insideCode = true
        }

        continue
      }

      if (c === text[pos + 1]) {
        // maybe (?) start or end of an entity
        let type: 'Italic' | 'Bold' | 'Underline' | 'Strike' | 'Spoiler' | null = null

        switch (c) {
          case '_':
            type = 'Italic'
            break
          case '*':
            type = 'Bold'
            break
          case '-':
            type = 'Underline'
            break
          case '~':
            type = 'Strike'
            break
          case '|':
            type = 'Spoiler'
            break
        }

        if (type) {
          if (!(type in stacks)) stacks[type] = []
          const isBegin = stacks[type].length === 0

          if (isBegin) {
            stacks[type].push({
              _: `messageEntity${type}`,
              offset: result.length,
              length: 0,
            })
          } else {
            // valid because isBegin is false

            const ent = stacks[type].pop()!
            ent.length = result.length - ent.offset
            entities.push(ent)
          }

          pos += 2
          continue
        }
      }

      if (c === '\n') {
        if (result.length !== 0) {
          result += '\n'
        }

        const nonWhitespace = text.slice(pos + 1).search(/[^ \t]/)

        if (nonWhitespace !== -1) {
          pos += nonWhitespace + 1
        } else {
          pos = len
        }

        if (currentBlockquoteStart != null) {
          const prevEnd = prevBlockquote ? prevBlockquote.offset + prevBlockquote.length : Number.NaN
          if (currentBlockquoteStart - 1 === prevEnd) {
            // extend the previous entity
            prevBlockquote!.length += result.length - currentBlockquoteStart
          } else {
            if (prevBlockquote) entities.push(prevBlockquote)
            prevBlockquote = {
              _: 'messageEntityBlockquote',
              offset: currentBlockquoteStart,
              length: result.length - currentBlockquoteStart - 1,
            }
          }
          currentBlockquoteStart = null
        }
        continue
      }

      if (c === '>' && (result.length === 0 || result[result.length - 1] === '\n')) {
        currentBlockquoteStart = result.length
        pos += 1
        continue
      }

      if (c === ' ' && currentBlockquoteStart === result.length) {
        // ignore spaces after `>`
        pos += 1
        continue
      }

      // nothing matched => normal character
      result += c
      pos += 1
    }
  }

  if (typeof strings === 'string') strings = [strings] as unknown as TemplateStringsArray

  sub.forEach((it, idx) => {
    feed(strings[idx])

    if (typeof it === 'boolean' || !it) return

    if (insideLinkUrl) {
      if (typeof it === 'string' || typeof it === 'number') {
        pendingLinkUrl += it
      } else if (Long.isLong(it)) {
        pendingLinkUrl += it.toString(10)
      } else {
        // ignore the entity, only use text
        pendingLinkUrl += it.text
      }

      return
    }

    if (typeof it === 'string' || typeof it === 'number') {
      result += it
    } else if (Long.isLong(it)) {
      result += it.toString(10)
    } else {
      // TextWithEntities or MessageEntity
      const text = it.text
      const innerEntities = 'raw' in it ? [it.raw] : it.entities

      const baseOffset = result.length
      result += text

      if (innerEntities) {
        for (const ent of innerEntities) {
          entities.push({ ...ent, offset: ent.offset + baseOffset })
        }
      }
    }
  })

  feed(strings[strings.length - 1])

  if (prevBlockquote) entities.push(prevBlockquote)

  function adjustOffsets(from: number, by: number): void {
    for (const ent of entities) {
      if (ent.offset < from) continue
      if (by >= 0) {
        ent.offset += by
        continue
      }

      const adjustTotal = Math.min(ent.offset, Math.abs(by))
      const adjustInternal = Math.max(Math.abs(by) - ent.offset, 0)
      ent.offset -= adjustTotal
      ent.length -= adjustInternal
    }
    for (const stack of Object.values(stacks)) {
      for (const ent of stack) {
        if (ent.offset >= from) ent.offset += by
      }
    }
  }

  for (const [name, stack] of Object.entries(stacks)) {
    if (stack.length > 1) {
      // todo: is this even possible?
      throw new Error(`Malformed ${name} entity`)
    }

    if (stack.length) {
      // unterminated entity
      switch (name) {
        case 'link': {
          const startOffset = stack.pop()!.offset
          insideLink = false
          insideLinkUrl = false
          const url = pendingLinkUrl
          pendingLinkUrl = ''
          result = `${result.substring(0, startOffset)}[${result.substring(startOffset)}](`
          adjustOffsets(startOffset, 1)
          feed(url)
          break
        }
        default: {
          const startOffset = stack.pop()!.offset
          const tag = {
            Bold: TAG_BOLD,
            Italic: TAG_ITALIC,
            Underline: TAG_UNDERLINE,
            Strike: TAG_STRIKE,
            Spoiler: TAG_SPOILER,
            code: TAG_CODE,
          }[name]
          if (!tag) throw new Error(`invalid tag ${name}`) // should never happen
          const remaining = result.substring(startOffset)
          result = `${result.substring(0, startOffset)}${tag}`
          adjustOffsets(startOffset, tag.length)
          feed(remaining)
          break
        }
      }
    }
  }

  // trim text on both sides and adjust offsets
  const resultTrimmed = result.trimStart()
  const numCharsTrimmed = result.length - resultTrimmed.length
  result = resultTrimmed
  adjustOffsets(0, -numCharsTrimmed)

  result = result.trimEnd()
  const finalEntities: tl.TypeMessageEntity[] = []
  for (const ent of entities) {
    const end = ent.offset + ent.length
    if (end > result.length) ent.length = result.length - ent.offset
    if (ent.length > 0) finalEntities.push(ent)
  }

  return {
    text: result,
    entities: finalEntities,
  }
}

export const md: {
  /**
   * Tagged template based Markdown-to-entities parser function
   *
   * Additionally, `md` function has two static methods:
   * - `md.escape` - escape a string to be safely used in Markdown
   *   (should not be needed in most cases, as `md` function itself handles all `string`s
   *   passed to it automatically as plain text)
   * - `md.unparse` - add Markdown formatting to the text given the plain text and entities contained in it
   *
   * @example
   * ```typescript
   * const text = md`**${user.displayName}**`
   * ```
   */
  (
    strings: TemplateStringsArray,
    ...sub: (InputText | MessageEntity | Long | boolean | number | undefined | null)[]
  ): TextWithEntities
  /**
   * A variant taking a plain JS string as input
   * and parsing it.
   *
   * Useful for cases when you already have a string
   * (e.g. from some server) and want to parse it.
   *
   * @example
   * ```typescript
   * const string = '**hello**'
   * const text = md(string)
   * ```
   */
  (string: string): TextWithEntities
  escape: typeof escape
  unparse: typeof unparse
} = Object.assign(parse, {
  escape,
  unparse,
})
