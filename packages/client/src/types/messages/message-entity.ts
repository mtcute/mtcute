import { tl } from '@mtcute/core'

import { makeInspectable } from '../../utils'

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
              | 'blockquote'
              | 'bank_card'
              | 'unknown'
      }
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
    constructor(readonly raw: tl.TypeMessageEntity, readonly _text?: string) {}

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

    private _params?: MessageEntityParams
    /**
     * Params of the entity
     */
    get params(): MessageEntityParams {
        if (this._params) return this._params

        switch (this.raw._) {
            case 'messageEntityMention':
                return (this._params = { kind: 'mention' })
            case 'messageEntityHashtag':
                return (this._params = { kind: 'hashtag' })
            case 'messageEntityCashtag':
                return (this._params = { kind: 'cashtag' })
            case 'messageEntityBotCommand':
                return (this._params = { kind: 'bot_command' })
            case 'messageEntityUrl':
                return (this._params = { kind: 'url' })
            case 'messageEntityEmail':
                return (this._params = { kind: 'email' })
            case 'messageEntityPhone':
                return (this._params = { kind: 'phone_number' })
            case 'messageEntityBold':
                return (this._params = { kind: 'bold' })
            case 'messageEntityItalic':
                return (this._params = { kind: 'italic' })
            case 'messageEntityUnderline':
                return (this._params = { kind: 'underline' })
            case 'messageEntityStrike':
                return (this._params = { kind: 'strikethrough' })
            case 'messageEntitySpoiler':
                return (this._params = { kind: 'spoiler' })
            case 'messageEntityCode':
                return (this._params = { kind: 'code' })
            case 'messageEntityPre':
                return (this._params = { kind: 'pre', language: this.raw.language })
            case 'messageEntityTextUrl':
                return (this._params = { kind: 'text_link', url: this.raw.url })
            case 'messageEntityMentionName':
                return (this._params = { kind: 'text_mention', userId: this.raw.userId })
            case 'messageEntityBlockquote':
                return (this._params = { kind: 'blockquote' })
            case 'messageEntityCustomEmoji':
                return (this._params = { kind: 'emoji', emojiId: this.raw.documentId })
            case 'messageEntityBankCard':
                return (this._params = { kind: 'bank_card' })
        }

        return (this._params = { kind: 'unknown' })
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
    ): this is MessageEntity & { content: Extract<MessageEntityParams, { kind: T }>; kind: T } {
        return this.params.kind === kind
    }
}

makeInspectable(MessageEntity)
