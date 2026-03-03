import type { InputText, MessageEntity, TextWithEntities, tl } from '@mtcute/core'
import { dateEntityFormatToString, parseDateEntityFormat } from '@mtcute/core/utils.js'
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

function dedent(strings: TemplateStringsArray): string[] {
  // join all parts to find common indentation
  const joined = strings.join('\x00')
  const lines = joined.split('\n')

  // find minimum indentation (skip first and last lines, skip empty lines)
  let minIndent = Infinity

  for (let i = 1; i < lines.length; i++) {
    const match = lines[i].match(/^(\s*)\S/)
    if (match) minIndent = Math.min(minIndent, match[1].length)
  }

  if (minIndent === Infinity) minIndent = 0

  // strip common indentation from each part
  const result: string[] = []
  let remainder = joined

  for (let i = 0; i < strings.length; i++) {
    const part = remainder.slice(0, strings[i].length)
    remainder = remainder.slice(strings[i].length + 1) // +1 for \x00

    const partLines = part.split('\n')
    for (let j = 0; j < partLines.length; j++) {
      // don't dedent first line of first part (it's on the same line as backtick)
      if (i === 0 && j === 0) continue
      partLines[j] = partLines[j].slice(minIndent)
    }
    result.push(partLines.join('\n'))
  }

  // strip leading newline from first part and trailing whitespace from last part
  if (result[0].startsWith('\n')) result[0] = result[0].slice(1)
  result[result.length - 1] = result[result.length - 1].replace(/\n[ \t]*$/, '')

  return result
}

function parse(
  keepWhitespace: boolean,
  strings: TemplateStringsArray | string,
  ...sub: (InputText | MessageEntity | Long | boolean | number | undefined | null)[]
): TextWithEntities {
  const stacks: Record<string, tl.Mutable<tl.TypeMessageEntity>[]> = {}
  const entities: tl.TypeMessageEntity[] = []
  let plainText = ''
  let pendingText = ''

  let isInsideAttrib = false

  function processPendingText(tagEnd = false, forceKeepWhitespace = false) {
    if (!pendingText.length) return

    if (!stacks.pre?.length && !keepWhitespace && !forceKeepWhitespace) {
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
        case 'tg-time': {
          // compat with bot api: <tg-time unix="1647531900" format="t">22:45</tg-time>
          const unix = attribs.unix
          if (!unix || !unix.match(/^\d+$/)) return

          entity = {
            _: 'messageEntityFormattedDate',
            offset: plainText.length,
            length: 0,
            date: Number.parseInt(unix),
            ...(attribs.format ? parseDateEntityFormat(attribs.format) : {}),
          }
          break
        }
        case 'time': {
          // compat with native html element: <time datetime="2022-03-17T22:45:00Z">22:45</time>
          const datetime = attribs.datetime
          if (!datetime) return

          const date = Math.floor(new Date(datetime).getTime() / 1000)
          if (Number.isNaN(date)) return

          entity = {
            _: 'messageEntityFormattedDate',
            offset: plainText.length,
            length: 0,
            date,
            ...(attribs.format ? parseDateEntityFormat(attribs.format) : {}),
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
  if (keepWhitespace) strings = dedent(strings) as unknown as TemplateStringsArray

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

/** Options passed to `html.unparse` / `thtml.unparse` */
export interface HtmlUnparseOptions {
  /**
   * Syntax highlighter to use when un-parsing `pre` tags with language
   */
  syntaxHighlighter?: (code: string, language: string) => string
}

// internal function that uses recursion to correctly process nested & overlapping entities
function _unparse(
  keepWhitespace: boolean,
  text: string,
  entities: ReadonlyArray<tl.TypeMessageEntity>,
  params: HtmlUnparseOptions,
  entitiesOffset = 0,
  offset = 0,
  length = text.length,
): string {
  if (!text) return text

  if (!entities.length || entities.length === entitiesOffset) {
    if (keepWhitespace) return escape(text)

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
      entityText = _unparse(keepWhitespace, substr, entities, params, i + 1, offset + relativeOffset, length)
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
      case 'messageEntityFormattedDate': {
        const fmt = dateEntityFormatToString(entity)
        html.push(`<tg-time unix="${entity.date}"${fmt ? ` format="${fmt}"` : ''}>${entityText}</tg-time>`)
        break
      }
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
function unparse(keepWhitespace: boolean, input: InputText, options?: HtmlUnparseOptions): string {
  if (typeof input === 'string') {
    return _unparse(keepWhitespace, input, [], options ?? {})
  }

  return _unparse(keepWhitespace, input.text, input.entities ?? [], options ?? {})
}

type HtmlSub = InputText | MessageEntity | Long | boolean | number | undefined | null

interface HtmlTagFn {
  (strings: TemplateStringsArray, ...sub: HtmlSub[]): TextWithEntities
  (string: string): TextWithEntities
  escape: typeof escape
  unparse: (input: InputText, options?: HtmlUnparseOptions) => string
}

/**
 * Tagged template based HTML-to-entities parser function.
 *
 * Whitespace is handled like in real HTML: newlines and consecutive spaces
 * are collapsed into a single space. Use `<br>` for line breaks
 * and `&nbsp;` for multiple spaces.
 *
 * Also has static methods:
 * - `html.escape` - escape a string to be safely used in HTML
 * - `html.unparse` - add HTML formatting to the text given the plain text and entities contained in it
 *
 * @example
 * ```typescript
 * // whitespace is collapsed, <br> for newlines
 * html`
 *   <b>Hello</b>,
 *   <i>world</i>!
 * `
 * // => { text: 'Hello, world!' }
 * ```
 *
 * @see {@link thtml} for a variant that preserves whitespace as-is
 */
export const html: HtmlTagFn = Object.assign(
  parse.bind(null, false),
  { escape, unparse: unparse.bind(null, false) },
)

/**
 * Like {@link html}, but preserves whitespace as-is
 * instead of collapsing it like HTML does.
 *
 * Leading indentation common to all lines is stripped (dedented),
 * making it safe to use in indented code.
 *
 * Also has static methods:
 * - `thtml.escape` - escape a string to be safely used in HTML
 * - `thtml.unparse` - like `html.unparse`, but preserves whitespace in the output
 *
 * @example
 * ```typescript
 * // whitespace and newlines are preserved, common indent is stripped
 * thtml`
 *   <b>Hello</b>,
 *   <i>world</i>!
 * `
 * // => { text: 'Hello,\nworld!' }
 * ```
 */
export const thtml: HtmlTagFn = Object.assign(
  parse.bind(null, true),
  { escape, unparse: unparse.bind(null, true) },
)
