import type { IMessageEntityParser, MessageEntity } from '@mtcute/client'
import { tl } from '@mtcute/tl'
import { FormattedString } from '@mtcute/client'
import Long from 'long'

const MENTION_REGEX = /^tg:\/\/user\?id=(\d+)(?:&hash=(-?[0-9a-fA-F]+)(?:&|$)|&|$)/

const TAG_BOLD = '**'
const TAG_ITALIC = '__'
const TAG_UNDERLINE = '--'
const TAG_STRIKE = '~~'
const TAG_CODE = '`'
const TAG_PRE = '```'

const TO_BE_ESCAPED = /[*_\-~`[\\\]]/g

/**
 * Tagged template based helper for escaping entities in Markdown
 *
 * @example
 * ```typescript
 * const escaped = md`**${user.displayName}**`
 * ```
 */
export function md(strings: TemplateStringsArray, ...sub: (string | FormattedString)[]): FormattedString {
    let str = ''
    sub.forEach((it, idx) => {
        if (typeof it === 'string') it = MarkdownMessageEntityParser.escape(it as string)
        else {
            if (it.mode && it.mode !== 'markdown') throw new Error(`Incompatible parse mode: ${it.mode}`)
            it = it.value
        }

        str += strings[idx] + it
    })
    return { value: str + strings[strings.length - 1], mode: 'markdown' }
}

/**
 * Markdown MessageEntity parser.
 *
 * This class is **not** compatible with the Bot API Markdown nor MarkdownV2,
 * please read the [documentation](../) to learn about syntax.
 */
export class MarkdownMessageEntityParser implements IMessageEntityParser {
    name = 'markdown'

    /**
     * Escape the text so it can be safely used inside Markdown code.
     *
     * @param str  String to be escaped
     */

    /* istanbul ignore next */
    static escape(str: string): string {
        // this code doesn't really need to be tested since it's just
        // a simplified version of what is used in .unparse()
        return str.replace(TO_BE_ESCAPED, (s) => '\\' + s)
    }

    parse(text: string): [string, tl.TypeMessageEntity[]] {
        const entities: tl.TypeMessageEntity[] = []
        const len = text.length
        let result = ''

        const stacks: Record<string, tl.Mutable<tl.TypeMessageEntity>[]> = {}

        let insideCode = false
        let insidePre = false
        let insideLink = false

        let pos = 0
        while (pos < len) {
            const c = text[pos]

            if (c === '\\') {
                result += text[pos + 1]
                pos += 2
                continue
            }

            if (insideCode) {
                if (c === '`') {
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
                        const ent = stacks.pre.pop()!
                        ent.length = result.length - ent.offset
                        entities.push(ent)
                        insidePre = false
                        pos += 3
                        continue
                    } else {
                        // closed with single or double backtick
                        // i.e. not closed actually! this is totally valid md:
                        // ```javascript
                        // const a = ``;
                        // ```

                        // compensate that `pos` change we made earlier
                        if (c === '\n') pos -= 1
                    }
                }

                pos += 1
                result += c
                continue
            }

            if (insideLink && c === ']') {
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
                let url = ''
                while (pos < text.length && text[pos] !== ')') {
                    url += text[pos++]
                }

                pos += 1 // )

                if (pos > text.length)
                    throw new Error('Malformed LINK entity, expected )')

                if (url.length) {
                    ent.length = result.length - ent.offset

                    const m = url.match(MENTION_REGEX)
                    if (m) {
                        const userId = parseInt(m[1])
                        const accessHash = m[2]
                        if (accessHash) {
                            ;(ent as tl.Mutable<tl.RawInputMessageEntityMentionName>)._ =
                                'inputMessageEntityMentionName'
                            ;(ent as tl.Mutable<tl.RawInputMessageEntityMentionName>).userId = {
                                _: 'inputUser',
                                userId,
                                accessHash: Long.fromString(accessHash, false,16),
                            }
                        } else {
                            ;(ent as tl.Mutable<tl.RawMessageEntityMentionName>)._ =
                                'messageEntityMentionName'
                            ;(ent as tl.Mutable<tl.RawMessageEntityMentionName>).userId = userId
                        }
                    } else {
                        if (url.match(/^\/\//)) url = 'http:' + url

                        ;(ent as tl.Mutable<tl.RawMessageEntityTextUrl>)._ =
                            'messageEntityTextUrl'
                        ;(ent as tl.Mutable<tl.RawMessageEntityTextUrl>).url = url
                    }
                    entities.push(ent)
                }

                insideLink = false
                continue
            }

            if (c === '[' && !insideLink) {
                pos += 1
                insideLink = true
                if (!('link' in stacks)) stacks.link = []
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

                    if (pos > text.length)
                        throw new Error(
                            'Malformed PRE entity, expected LF after ```'
                        )

                    if (!('pre' in stacks)) stacks.pre = []
                    stacks.pre.push({
                        _: 'messageEntityPre',
                        offset: result.length,
                        length: 0,
                        language,
                    })
                    insidePre = true
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
                let type:
                    | 'Italic'
                    | 'Bold'
                    | 'Underline'
                    | 'Strike'
                    | null = null
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
                }

                if (type) {
                    if (!(type in stacks)) stacks[type] = []
                    const isBegin = stacks[type].length === 0

                    if (isBegin) {
                        stacks[type].push({
                            // this is valid, but idk how to make typescript happy
                            _: ('messageEntity' + type) as any,
                            offset: result.length,
                            length: 0,
                        })
                    } else {
                        const ent = stacks[type].pop()!
                        ent.length = result.length - ent.offset
                        entities.push(ent)
                    }

                    pos += 2
                    continue
                }
            }

            // nothing matched => normal character
            result += c
            pos += 1
        }

        return [result, entities]
    }

    unparse(text: string, entities: ReadonlyArray<MessageEntity>): string {
        // keep track of positions of inserted escape symbols
        const escaped: number[] = []
        text = text.replace(TO_BE_ESCAPED, (s, pos: number) => {
            escaped.push(pos)
            return '\\' + s
        })
        const hasEscaped = escaped.length > 0

        type InsertLater = [number, string]
        const insert: InsertLater[] = []

        for (const entity of entities) {
            const type = entity.type

            let start = entity.offset
            let end = start + entity.length

            if (start > text.length) continue
            if (start < 0) start = 0
            if (end > text.length) end = text.length

            if (hasEscaped) {
                // determine number of escape chars since the beginning of the string
                let escapedPos = 0

                while (
                    escapedPos < escaped.length &&
                    escaped[escapedPos] < start
                ) {
                    escapedPos += 1
                }
                start += escapedPos

                while (
                    escapedPos < escaped.length &&
                    escaped[escapedPos] <= end
                ) {
                    escapedPos += 1
                }
                end += escapedPos
            }

            let startTag, endTag: string
            switch (type) {
                case 'bold':
                    startTag = endTag = TAG_BOLD
                    break
                case 'italic':
                    startTag = endTag = TAG_ITALIC
                    break
                case 'underline':
                    startTag = endTag = TAG_UNDERLINE
                    break
                case 'strikethrough':
                    startTag = endTag = TAG_STRIKE
                    break
                case 'code':
                    startTag = endTag = TAG_CODE
                    break
                case 'pre':
                    startTag = TAG_PRE

                    if (entity.language) {
                        startTag += entity.language
                    }

                    startTag += '\n'
                    endTag = '\n' + TAG_PRE
                    break
                case 'text_link':
                    startTag = '['
                    endTag = `](${entity.url!})`
                    break
                case 'text_mention':
                    startTag = '['
                    endTag = `](tg://user?id=${entity.userId!})`
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
}
