import { tl } from '@mtcute/tl'
import { makeInspectable } from '../utils'

const entityToType: Partial<
    Record<tl.TypeMessageEntity['_'], MessageEntity.Type>
> = {
    messageEntityBlockquote: 'blockquote',
    messageEntityBold: 'bold',
    messageEntityBotCommand: 'bot_command',
    messageEntityCashtag: 'cashtag',
    messageEntityCode: 'code',
    messageEntityEmail: 'email',
    messageEntityHashtag: 'hashtag',
    messageEntityItalic: 'italic',
    messageEntityMention: 'mention',
    messageEntityMentionName: 'text_mention',
    messageEntityPhone: 'phone_number',
    messageEntityPre: 'pre',
    messageEntityStrike: 'strikethrough',
    messageEntityTextUrl: 'text_link',
    messageEntityUnderline: 'underline',
    messageEntityUrl: 'url',
}

export namespace MessageEntity {
    /**
     * Type of the entity. Can be:
     *   - 'mention': `@username`.
     *   - 'hashtag': `#hashtag`.
     *   - 'cashtag': `$USD`.
     *   - 'bot_command': `/start`.
     *   - 'url': `https://example.com` (see {@link MessageEntity.url}).
     *   - 'email': `example@example.com`.
     *   - 'phone_number': `+42000`.
     *   - 'bold': **bold text**.
     *   - 'italic': *italic text*.
     *   - 'underline': <u>underlined</u> text.
     *   - 'strikethrough': <s>strikethrough</s> text.
     *   - 'code': `monospaced` string.
     *   - 'pre': `monospaced` block (see {@link MessageEntity.language}).
     *   - 'text_link': for clickable text URLs.
     *   - 'text_mention': for users without usernames (see {@link MessageEntity.user} below).
     *   - 'blockquote': A blockquote
     */
    export type Type =
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
        | 'code'
        | 'pre'
        | 'text_link'
        | 'text_mention'
        | 'blockquote'
}

/**
 * One special entity in a text message (like mention, hashtag, URL, etc.)
 */
export class MessageEntity {
    /**
     * Underlying raw TL object
     */
    readonly raw!: tl.TypeMessageEntity

    /**
     * Type of the entity. See {@link MessageEntity.Type} for a list of possible values
     */
    readonly type!: MessageEntity.Type

    /**
     * Offset in UTF-16 code units to the start of the entity.
     *
     * Since JS strings are UTF-16, you can use this as-is
     */
    readonly offset!: number

    /**
     * Length of the entity in UTF-16 code units.
     *
     * Since JS strings are UTF-16, you can use this as-is
     */
    readonly length!: number

    /**
     * When `type=text_link`, contains the URL that would be opened if user taps on the text
     */
    readonly url?: string

    /**
     * When `type=text_mention`, contains the ID of the user mentioned.
     */
    readonly userId?: number

    /**
     * When `type=pre`, contains the programming language of the entity text
     */
    readonly language?: string

    static _parse(obj: tl.TypeMessageEntity): MessageEntity | null {
        const type = entityToType[obj._]
        if (!type) return null

        return {
            raw: obj,
            type,
            offset: obj.offset,
            length: obj.length,
            url: obj._ === 'messageEntityTextUrl' ? obj.url : undefined,
            userId:
                obj._ === 'messageEntityMentionName' ? obj.userId : undefined,
            language: obj._ === 'messageEntityPre' ? obj.language : undefined,
        }
    }
}

makeInspectable(MessageEntity)
