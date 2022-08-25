import { Parser } from 'htmlparser2'
import Long from 'long'
import type {
    IMessageEntityParser,
    MessageEntity,
    FormattedString,
    tl,
} from '@mtcute/client'

const MENTION_REGEX =
    /^tg:\/\/user\?id=(\d+)(?:&hash=(-?[0-9a-fA-F]+)(?:&|$)|&|$)/

/**
 * Tagged template based helper for escaping entities in HTML
 *
 * @example
 * ```typescript
 * const escaped = html`<b>${user.displayName}</b>`
 * ```
 */
export function html(
    strings: TemplateStringsArray,
    ...sub: (string | FormattedString<'html'> | boolean | undefined | null)[]
): FormattedString<'html'> {
    let str = ''
    sub.forEach((it, idx) => {
        if (typeof it === 'boolean' || !it) return

        if (typeof it === 'string') {
            it = HtmlMessageEntityParser.escape(it, !!str.match(/=['"]$/))
        } else {
            if (it.mode && it.mode !== 'html')
                throw new Error(`Incompatible parse mode: ${it.mode}`)
            it = it.value
        }

        str += strings[idx] + it
    })
    return { value: str + strings[strings.length - 1], mode: 'html' }
}

export namespace HtmlMessageEntityParser {
    /**
     * Syntax highlighter function used in {@link HtmlMessageEntityParser.unparse}
     *
     * Must be sync (this might change in the future) and must return valid HTML.
     */
    export type SyntaxHighlighter = (code: string, language: string) => string

    export interface Options {
        syntaxHighlighter?: SyntaxHighlighter
    }
}

/**
 * HTML MessageEntity parser.
 *
 * This class implements syntax very similar to one available
 * in the Bot API ([documented here](https://core.telegram.org/bots/api#html-style))
 * with some slight differences.
 */
export class HtmlMessageEntityParser implements IMessageEntityParser {
    name = 'html'

    private readonly _syntaxHighlighter?: HtmlMessageEntityParser.SyntaxHighlighter

    constructor(options?: HtmlMessageEntityParser.Options) {
        this._syntaxHighlighter = options?.syntaxHighlighter
    }

    /**
     * Escape the string so it can be safely used inside HTML
     *
     * @param str  String to be escaped
     * @param quote  Whether `"` (double quote) should be escaped as `&quot;`
     */
    static escape(str: string, quote = false): string {
        str = str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
        if (quote) str = str.replace(/"/g, '&quot;')

        return str
    }

    parse(text: string): [string, tl.TypeMessageEntity[]] {
        const stacks: Record<string, tl.Mutable<tl.TypeMessageEntity>[]> = {}
        const entities: tl.TypeMessageEntity[] = []
        let plainText = ''
        let pendingText = ''

        function processPendingText(tagEnd = false) {
            if (!pendingText.length) return

            if (!stacks.pre?.length) {
                pendingText = pendingText.replace(/[^\S\u00A0]+/gs, ' ')

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
                        plainText += '\n'
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
                        entity = {
                            _: 'messageEntitySpoiler',
                            offset: plainText.length,
                            length: 0,
                        }
                        break
                    case 'emoji': {
                        const id = attribs.id
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
                            const id = parseInt(mention[1])
                            const accessHash = mention[2]

                            if (accessHash) {
                                entity = {
                                    _: 'inputMessageEntityMentionName',
                                    offset: plainText.length,
                                    length: 0,
                                    userId: {
                                        _: 'inputUser',
                                        userId: id,
                                        accessHash: Long.fromString(
                                            accessHash,
                                            false,
                                            16
                                        ),
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
                            if (url.match(/^\/\//)) url = 'http:' + url

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
                if (name !== 'pre' || !stacks.pre.length) {
                    entities.push(entity)
                }
            },
            ontext(data) {
                pendingText += data
            },
        })

        parser.write(text)

        processPendingText(true)

        return [plainText.replace(/\u00A0/g, ' '), entities]
    }

    unparse(text: string, entities: ReadonlyArray<MessageEntity>): string {
        return this._unparse(text, entities)
    }

    // internal function that uses recursion to correctly process nested & overlapping entities
    private _unparse(
        text: string,
        entities: ReadonlyArray<MessageEntity>,
        entitiesOffset = 0,
        offset = 0,
        length = text.length
    ): string {
        if (!text) return text
        if (!entities.length || entities.length === entitiesOffset) {
            return HtmlMessageEntityParser.escape(text)
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
                html.push(
                    HtmlMessageEntityParser.escape(
                        text.substring(lastOffset, relativeOffset)
                    )
                )
            } else if (relativeOffset < lastOffset) {
                length -= lastOffset - relativeOffset
                relativeOffset = lastOffset
            }

            if (length <= 0 || relativeOffset >= end || relativeOffset < 0)
                continue

            let skip = false

            const substr = text.substr(relativeOffset, length)
            if (!substr) continue

            const type = entity.type

            let entityText

            if (type === 'pre') {
                entityText = substr
            } else {
                entityText = this._unparse(
                    substr,
                    entities,
                    i + 1,
                    offset + relativeOffset,
                    length
                )
            }

            switch (type) {
                case 'bold':
                case 'italic':
                case 'underline':
                case 'strikethrough':
                    html.push(`<${type[0]}>${entityText}</${type[0]}>`)
                    break
                case 'code':
                case 'pre':
                    html.push(
                        `<${type}${
                            entity.language
                                ? ` language="${entity.language}"`
                                : ''
                        }>${
                            this._syntaxHighlighter && entity.language
                                ? this._syntaxHighlighter(
                                      entityText,
                                      entity.language
                                  )
                                : entityText
                        }</${type}>`
                    )
                    break
                case 'blockquote':
                case 'spoiler':
                    html.push(`<${type}>${entityText}</${type}>`)
                    break
                case 'email':
                    html.push(
                        `<a href="mailto:${entityText}">${entityText}</a>`
                    )
                    break
                case 'url':
                    html.push(`<a href="${entityText}">${entityText}</a>`)
                    break
                case 'text_link':
                    html.push(
                        `<a href="${HtmlMessageEntityParser.escape(
                            entity.url!,
                            true
                        )}">${entityText}</a>`
                    )
                    break
                case 'text_mention':
                    html.push(
                        `<a href="tg://user?id=${entity.userId!}">${entityText}</a>`
                    )
                    break
                default:
                    skip = true
                    break
            }

            lastOffset = relativeOffset + (skip ? 0 : length)
        }

        html.push(HtmlMessageEntityParser.escape(text.substr(lastOffset)))

        return html.join('')
    }
}
