import { tl } from '@mtcute/tl'

import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'

/**
 * Params of the entity. `.kind` can be:
 *   - 'mention': `@username`.
 *   - 'hashtag': `#hashtag`.
 *   - 'cashtag': `$USD`.
 *   - 'bot_command': `/start`.
 *   - 'url': `https://example.com`
 *   - 'email': `example@example.com`.
 *   - 'phone_number': `+42000`.
 *   - 'bold': **bold text**.
 *   - 'italic': *italic text*.
 *   - 'underline': <u>underlined</u> text.
 *   - 'strikethrough': <s>strikethrough</s> text.
 *   - 'code': `monospaced` string.
 *   - 'pre': `monospaced` block. `.language` contains the language of the block (if available).
 *   - 'text_link': for clickable text URLs.
 *   - 'text_mention': for user mention by name. `.userId` contains the ID of the mentioned user.
 *   - 'blockquote': A blockquote
 *   - 'emoji': A custom emoji. `.emojiId` contains the emoji ID.
 */
export type MessageEntityParams =
    | {
          kind:
              | 'mention'
              | 'hashtag'
              | 'cashtag'
              | 'bot_command'
              | 'url'
              | 'email'
              | 'phone_number'
              | 'bold'
              | 'italic'
              | 'underline'
              | 'strikethrough'
              | 'spoiler'
              | 'code'
              | 'bank_card'
              | 'unknown'
      }
    | { kind: 'blockquote'; collapsible: boolean }
    | { kind: 'pre'; language?: string }
    | { kind: 'text_link'; url: string }
    | { kind: 'text_mention'; userId: number }
    | { kind: 'emoji'; emojiId: tl.Long }

/**
 * Kind of the entity. For more information, see {@link MessageEntityParams}
 */
export type MessageEntityKind = MessageEntityParams['kind']

/**
 * One special entity in a text message (like mention, hashtag, URL, etc.)
 */
export class MessageEntity {
    constructor(
        readonly raw: tl.TypeMessageEntity,
        readonly _text?: string,
    ) {}

    /**
     * Offset in UTF-16 code units to the start of the entity.
     *
     * Since JS strings are UTF-16, you can use this as-is
     */
    get offset() {
        return this.raw.offset
    }

    /**
     * Length of the entity in UTF-16 code units.
     *
     * Since JS strings are UTF-16, you can use this as-is
     */
    get length() {
        return this.raw.length
    }

    /**
     * Kind of the entity (see {@link MessageEntityParams})
     */
    get kind(): MessageEntityKind {
        return this.params.kind
    }

    /**
     * Params of the entity
     */
    get params(): MessageEntityParams {
        switch (this.raw._) {
            case 'messageEntityMention':
                return { kind: 'mention' }
            case 'messageEntityHashtag':
                return { kind: 'hashtag' }
            case 'messageEntityCashtag':
                return { kind: 'cashtag' }
            case 'messageEntityBotCommand':
                return { kind: 'bot_command' }
            case 'messageEntityUrl':
                return { kind: 'url' }
            case 'messageEntityEmail':
                return { kind: 'email' }
            case 'messageEntityPhone':
                return { kind: 'phone_number' }
            case 'messageEntityBold':
                return { kind: 'bold' }
            case 'messageEntityItalic':
                return { kind: 'italic' }
            case 'messageEntityUnderline':
                return { kind: 'underline' }
            case 'messageEntityStrike':
                return { kind: 'strikethrough' }
            case 'messageEntitySpoiler':
                return { kind: 'spoiler' }
            case 'messageEntityCode':
                return { kind: 'code' }
            case 'messageEntityPre':
                return { kind: 'pre', language: this.raw.language }
            case 'messageEntityTextUrl':
                return { kind: 'text_link', url: this.raw.url }
            case 'messageEntityMentionName':
                return { kind: 'text_mention', userId: this.raw.userId }
            case 'messageEntityBlockquote':
                return { kind: 'blockquote', collapsible: this.raw.collapsed! }
            case 'messageEntityCustomEmoji':
                return { kind: 'emoji', emojiId: this.raw.documentId }
            case 'messageEntityBankCard':
                return { kind: 'bank_card' }
        }

        return { kind: 'unknown' }
    }

    /**
     * Text contained in this entity.
     *
     * > **Note**: This does not take into account that entities may overlap,
     * > and is only useful for simple cases.
     */
    get text(): string {
        if (!this._text) return ''

        return this._text.slice(this.raw.offset, this.raw.offset + this.raw.length)
    }

    /**
     * Checks if this entity is of the given type, and adjusts the type accordingly.
     * @param kind
     * @returns
     */
    is<const T extends MessageEntityKind>(
        kind: T,
    ): this is MessageEntity & { params: Extract<MessageEntityParams, { kind: T }>; kind: T } {
        return this.params.kind === kind
    }
}

memoizeGetters(MessageEntity, ['params'])
makeInspectable(MessageEntity)
