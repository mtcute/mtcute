import type { InputText, MessageEntity, TextWithEntities, tl } from '@mtcute/core'
import { Parser } from 'htmlparser2'
import Long from 'long'

const MENTION_REGEX = /^tg:\/\/user\?id=(\d+)(?:&hash=(-?[0-9a-fA-F]+)(?:&|$)|&|$)/

/**
 * Escape a string to be safely used in HTML.
 *
 * > **Note**: this function is in most cases not needed, as `html` function
 * > handles all `string`s passed to it automatically as plain text.
 */
function escape(str: string, quote = false): string {
  str = str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  if (quote) str = str.replace(/"/g, '&quot;')

  return str
}

function parse(
  strings: TemplateStringsArray | string,
  ...sub: (InputText | MessageEntity | Long | boolean | number | undefined | null)[]
): TextWithEntities {
  const stacks: Record<string, tl.Mutable<tl.TypeMessageEntity>[]> = {}
  const entities: tl.TypeMessageEntity[] = []
  let plainText = ''
  let pendingText = ''

  let isInsideAttrib = false

  function processPendingText(tagEnd = false, keepWhitespace = false) {
    if (!pendingText.length) return

    if (!stacks.pre?.length && !keepWhitespace) {
      pendingText = pendingText.replace(/[^\S\u00A0]+/g, ' ')

      if (tagEnd) pendingText = pendingText.trimEnd()

      if (!plainText.length || plainText.match(/\s$/)) {
        pendingText = pendingText.trimStart()
      }
    }

    for (const ents of Object.values(stacks)) {
      for (const ent of ents) {
        ent.length += pendingText.length
      }
    }

    plainText += pendingText
    pendingText = ''
  }

  const parser = new Parser({
    onopentag(name, attribs) {
      name = name.toLowerCase()

      processPendingText()

      // ignore tags inside pre (except pre)
      if (name !== 'pre' && stacks.pre?.length) return

      let entity: tl.TypeMessageEntity

      switch (name) {
        case 'br':
          pendingText += '\n'
          processPendingText(true, true)

          return
        case 'b':
        case 'strong':
          entity = {
            _: 'messageEntityBold',
            offset: plainText.length,
            length: 0,
          }
          break
        case 'i':
        case 'em':
          entity = {
            _: 'messageEntityItalic',
            offset: plainText.length,
            length: 0,
          }
          break
        case 'u':
          entity = {
            _: 'messageEntityUnderline',
            offset: plainText.length,
            length: 0,
          }
          break
        case 's':
        case 'del':
        case 'strike':
          entity = {
            _: 'messageEntityStrike',
            offset: plainText.length,
            length: 0,
          }
          break
        case 'blockquote':
          entity = {
            _: 'messageEntityBlockquote',
            offset: plainText.length,
            length: 0,
            collapsed: 'collapsible' in attribs || 'expandable' in attribs,
          }
          break
        case 'code':
          entity = {
            _: 'messageEntityCode',
            offset: plainText.length,
            length: 0,
          }
          break
        case 'pre':
          entity = {
            _: 'messageEntityPre',
            offset: plainText.length,
            length: 0,
            language: attribs.language ?? '',
          }
          break
        case 'spoiler':
        case 'tg-spoiler':
          entity = {
            _: 'messageEntitySpoiler',
            offset: plainText.length,
            length: 0,
          }
          break

        case 'emoji':
        case 'tg-emoji': {
          const id = attribs.id || attribs['emoji-id']
          if (!id || !id.match(/^-?\d+$/)) return

          entity = {
            _: 'messageEntityCustomEmoji',
            offset: plainText.length,
            length: 0,
            documentId: Long.fromString(id),
          }
          break
        }
        case 'a': {
          let url = attribs.href
          if (!url) return

          const mention = MENTION_REGEX.exec(url)

          if (mention) {
            const id = Number.parseInt(mention[1])
            const accessHash = mention[2]

            if (accessHash) {
              entity = {
                _: 'inputMessageEntityMentionName',
                offset: plainText.length,
                length: 0,
                userId: {
                  _: 'inputUser',
                  userId: id,
                  accessHash: Long.fromString(accessHash, false, 16),
                },
              }
            } else {
              entity = {
                _: 'messageEntityMentionName',
                offset: plainText.length,
                length: 0,
                userId: id,
              }
            }
          } else {
            if (url.match(/^\/\//)) url = `http:${url}`

            entity = {
              _: 'messageEntityTextUrl',
              offset: plainText.length,
              length: 0,
              url,
            }
          }
          break
        }
        default:
          return
      }

      if (!(name in stacks)) {
        stacks[name] = []
      }
      stacks[name].push(entity)
    },
    onclosetag(name: string) {
      processPendingText(true)

      name = name.toLowerCase()

      // ignore tags inside pre (except pre)
      if (name !== 'pre' && stacks.pre?.length) return

      const entity = stacks[name]?.pop()

      if (!entity) return // unmatched close tag

      // ignore nested pre-s
      if (name !== 'pre' || !stacks.pre?.length) {
        entities.push(entity)
      }
    },
    ontext(data) {
      pendingText += data
    },
  })

  // a hack for interpolating inside attributes
  // instead of hacking into the parser itself (which would require a lot of work
  // and test coverage because of the number of edge cases), we'll just feed
  // an escaped version of the text right to the parser.
  // however, to do that we need to know if we are inside an attribute or not,
  // and htmlparser2 doesn't really expose that.
  // it only exposes .onattribute, which isn't really useful here, as
  // we want to know if we are mid-attribute or not
  const onattribname = parser.onattribname
  const onattribend = parser.onattribend

  parser.onattribname = function (startIdx, endIdx) {
    onattribname.call(this, startIdx, endIdx)
    isInsideAttrib = true
  }

  parser.onattribend = function (quote, endIdx) {
    onattribend.call(this, quote, endIdx)
    isInsideAttrib = false
  }

  if (typeof strings === 'string') strings = [strings] as unknown as TemplateStringsArray

  sub.forEach((it, idx) => {
    parser.write(strings[idx])

    if (typeof it === 'boolean' || !it) return

    if (isInsideAttrib) {
      let text: string

      if (typeof it === 'string') {
        text = it
      } else if (typeof it === 'number') {
        text = it.toString()
      } else if (Long.isLong(it)) {
        text = it.toString(10)
      } else {
        // obviously we can't have entities inside attributes, so just use the text
        text = it.text
      }
      parser.write(escape(text, true))

      return
    }

    if (typeof it === 'string') {
      processPendingText()
      pendingText += it
      processPendingText(false, true)
    } else if (Long.isLong(it) || typeof it === 'number') {
      pendingText += it.toString(10)
    } else {
      // TextWithEntities or MessageEntity
      const text = it.text
      const innerEntities = 'raw' in it ? [it.raw] : it.entities

      processPendingText()
      const baseOffset = plainText.length
      pendingText += text

      if (innerEntities) {
        for (const ent of innerEntities) {
          entities.push({ ...ent, offset: ent.offset + baseOffset })
        }
      }

      processPendingText(false, true)
    }
  })

  parser.write(strings[strings.length - 1])

  processPendingText(true)

  return {
    text: plainText.replace(/\u00A0/g, ' '),
    entities,
  }
}

/** Options passed to `html.unparse` */
export interface HtmlUnparseOptions {
  /**
   * Syntax highlighter to use when un-parsing `pre` tags with language
   */
  syntaxHighlighter?: (code: string, language: string) => string
}

// internal function that uses recursion to correctly process nested & overlapping entities
function _unparse(
  text: string,
  entities: ReadonlyArray<tl.TypeMessageEntity>,
  params: HtmlUnparseOptions,
  entitiesOffset = 0,
  offset = 0,
  length = text.length,
): string {
  if (!text) return text

  if (!entities.length || entities.length === entitiesOffset) {
    return escape(text)
      .replace(/\n/g, '<br>')
      .replace(/ {2,}/g, (match) => {
        return '&nbsp;'.repeat(match.length)
      })
  }

  const end = offset + length

  const html: string[] = []
  let lastOffset = 0

  for (let i = entitiesOffset; i < entities.length; i++) {
    const entity = entities[i]
    if (entity.offset >= end) break

    let entOffset = entity.offset
    let length = entity.length

    if (entOffset < 0) {
      length += entOffset
      entOffset = 0
    }

    let relativeOffset = entOffset - offset

    if (relativeOffset > lastOffset) {
      // add missing plain text
      html.push(escape(text.substring(lastOffset, relativeOffset)))
    } else if (relativeOffset < lastOffset) {
      length -= lastOffset - relativeOffset
      relativeOffset = lastOffset
    }

    if (length <= 0 || relativeOffset >= end || relativeOffset < 0) {
      continue
    }

    let skip = false

    const substr = text.substr(relativeOffset, length)
    if (!substr) continue

    const type = entity._

    let entityText

    if (type === 'messageEntityPre') {
      entityText = substr
    } else {
      entityText = _unparse(substr, entities, params, i + 1, offset + relativeOffset, length)
    }

    switch (type) {
      case 'messageEntityBold':
      case 'messageEntityItalic':
      case 'messageEntityUnderline':
      case 'messageEntityStrike':
      case 'messageEntityCode':
      case 'messageEntitySpoiler':
        {
          const tag = (
            {
              messageEntityBold: 'b',
              messageEntityItalic: 'i',
              messageEntityUnderline: 'u',
              messageEntityStrike: 's',
              messageEntityCode: 'code',
              messageEntitySpoiler: 'spoiler',
            } as const
          )[type]
          html.push(`<${tag}>${entityText}</${tag}>`)
        }
        break
      case 'messageEntityBlockquote':
        html.push(`<blockquote${entity.collapsed ? ' collapsible' : ''}>${entityText}</blockquote>`)
        break
      case 'messageEntityPre':
        html.push(
          `<pre${entity.language ? ` language="${entity.language}"` : ''}>${
            params.syntaxHighlighter && entity.language
              ? params.syntaxHighlighter(entityText, entity.language)
              : entityText
          }</pre>`,
        )
        break
      case 'messageEntityEmail':
        html.push(`<a href="mailto:${entityText}">${entityText}</a>`)
        break
      case 'messageEntityUrl':
        html.push(`<a href="${entityText}">${entityText}</a>`)
        break
      case 'messageEntityTextUrl':
        html.push(`<a href="${escape(entity.url, true)}">${entityText}</a>`)
        break
      case 'messageEntityMentionName':
        html.push(`<a href="tg://user?id=${entity.userId}">${entityText}</a>`)
        break
      default:
        skip = true
        break
    }

    lastOffset = relativeOffset + (skip ? 0 : length)
  }

  html.push(escape(text.substr(lastOffset)))

  return html.join('')
}

/**
 * Add HTML formatting to the text given the plain text and entities contained in it.
 */
function unparse(input: InputText, options?: HtmlUnparseOptions): string {
  if (typeof input === 'string') {
    return _unparse(input, [], options ?? {})
  }

  return _unparse(input.text, input.entities ?? [], options ?? {})
}

// typedoc doesn't support this yet, so we'll have to do it manually
// https://github.com/TypeStrong/typedoc/issues/2436

export const html: {
  /**
   * Tagged template based HTML-to-entities parser function
   *
   * Additionally, `md` function has two static methods:
   * - `html.escape` - escape a string to be safely used in HTML
   *   (should not be needed in most cases, as `html` function itself handles all `string`s
   *   passed to it automatically as plain text)
   * - `html.unparse` - add HTML formatting to the text given the plain text and entities contained in it
   *
   * @example
   * ```typescript
   * const text = html`<b>${user.displayName}</b>`
   * ```
   */
  (
    strings: TemplateStringsArray,
    ...sub: (InputText | MessageEntity | boolean | Long | number | undefined | null)[]
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
   * const string = '<b>hello</b>'
   * const text = html(string)
   * ```
   */
  (string: string): TextWithEntities
  escape: typeof escape
  unparse: typeof unparse
} = Object.assign(parse, {
  escape,
  unparse,
})
