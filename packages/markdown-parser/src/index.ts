import type { IMessageEntityParser, MessageEntity } from '@mtcute/client'
import { tl } from '@mtcute/tl'
import bigInt from 'big-integer'

const MENTION_REGEX = /^tg:\/\/user\?id=(\d+)(?:&hash=([0-9a-fA-F]+)(?:&|$)|&|$)/

const TAG_BOLD = '**'
const TAG_ITALIC = '__'
const TAG_UNDERLINE = '--'
const TAG_STRIKE = '~~'
const TAG_CODE = '`'
const TAG_PRE = '```'

const TO_BE_ESCAPED = /[*_\-~`[\\]]/g

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
                    // ignore this
                    pos += 1
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
                                accessHash: bigInt(accessHash, 16),
                            }
                        } else {
                            ;(ent as tl.Mutable<tl.RawMessageEntityMentionName>)._ =
                                'messageEntityMentionName'
                            ;(ent as tl.Mutable<tl.RawMessageEntityMentionName>).userId = userId
                        }
                    } else {
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
                if (c === '_') type = 'Italic'
                else if (c === '*') type = 'Bold'
                else if (c === '-') type = 'Underline'
                else if (c === '~') type = 'Strike'

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

    unparse(text: string, entities: MessageEntity[]): string {
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
            if (type === 'bold') {
                startTag = endTag = TAG_BOLD
            } else if (type === 'italic') {
                startTag = endTag = TAG_ITALIC
            } else if (type === 'underline') {
                startTag = endTag = TAG_UNDERLINE
            } else if (type === 'strikethrough') {
                startTag = endTag = TAG_STRIKE
            } else if (type === 'code') {
                startTag = endTag = TAG_CODE
            } else if (type === 'pre') {
                startTag = TAG_PRE

                if (entity.language) {
                    startTag += entity.language
                }

                startTag += '\n'
                endTag = '\n' + TAG_PRE
            } else if (type === 'text_link') {
                startTag = '['
                endTag = `](${entity.url!})`
            } else if (type === 'text_mention') {
                startTag = '['
                endTag = `](tg://user?id=${entity.userId!})`
            } else continue

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
