import { BaseTelegramClient, tl } from '@mtcute/core'

import { BotKeyboard, FormattedString, InputMediaLike, ReplyMarkup } from '../../types/index.js'
import { normalizeInlineId } from '../../utils/inline-utils.js'
import { _normalizeInputMedia } from '../files/normalize-input-media.js'
import { _parseEntities } from './parse-entities.js'

/**
 * Edit sent inline message text, media and reply markup.
 *
 * @param messageId
 *     Inline message ID, either as a TL object, or as a
 *     TDLib and Bot API compatible string
 * @param params
 */
export async function editInlineMessage(
    client: BaseTelegramClient,
    params: {
        /**
         * Inline message ID, either as a TL object, or as a
         * TDLib and Bot API compatible string
         */
        messageId: tl.TypeInputBotInlineMessageID | string

        /**
         * New message text
         *
         * When `media` is passed, `media.caption` is used instead
         */
        text?: string | FormattedString<string>

        /**
         * Parse mode to use to parse entities before sending
         * the message. Defaults to current default parse mode (if any).
         *
         * Passing `null` will explicitly disable formatting.
         */
        parseMode?: string | null

        /**
         * List of formatting entities to use instead of parsing via a
         * parse mode.
         *
         * **Note:** Passing this makes the method ignore {@link parseMode}
         *
         * When `media` is passed, `media.entities` is used instead
         */
        entities?: tl.TypeMessageEntity[]

        /**
         * New message media
         */
        media?: InputMediaLike

        /**
         * Whether to disable links preview in this message
         */
        disableWebPreview?: boolean

        /**
         * For bots: new reply markup.
         * If omitted, existing markup will be removed.
         */
        replyMarkup?: ReplyMarkup

        /**
         * For media, upload progress callback.
         *
         * @param uploaded  Number of bytes uploaded
         * @param total  Total file size in bytes
         */
        progressCallback?: (uploaded: number, total: number) => void
    },
): Promise<void> {
    let content: string | undefined = undefined
    let entities: tl.TypeMessageEntity[] | undefined
    let media: tl.TypeInputMedia | undefined = undefined

    const id = normalizeInlineId(params.messageId)

    if (params.media) {
        media = await _normalizeInputMedia(client, params.media, params, true)

        // if there's no caption in input media (i.e. not present or undefined),
        // user wants to keep current caption, thus `content` needs to stay `undefined`
        if ('caption' in params.media && params.media.caption !== undefined) {
            [content, entities] = await _parseEntities(
                client,
                params.media.caption,
                params.parseMode,
                params.media.entities,
            )
        }
    } else if (params.text) {
        [content, entities] = await _parseEntities(client, params.text, params.parseMode, params.entities)
    }

    let retries = 3

    while (retries--) {
        try {
            await client.call(
                {
                    _: 'messages.editInlineBotMessage',
                    id,
                    noWebpage: params.disableWebPreview,
                    replyMarkup: BotKeyboard._convertToTl(params.replyMarkup),
                    message: content,
                    entities,
                    media,
                },
                { dcId: id.dcId },
            )

            return
        } catch (e) {
            if (tl.RpcError.is(e, 'MEDIA_EMPTY')) {
                continue
            }

            throw e
        }
    }
}
