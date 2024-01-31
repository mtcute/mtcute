import { tl } from '@mtcute/tl'

import { ITelegramClient } from '../../client.types.js'
import { BotKeyboard, InputMediaLike, InputText, ReplyMarkup } from '../../types/index.js'
import { normalizeInlineId } from '../../utils/inline-utils.js'
import { _normalizeInputMedia } from '../files/normalize-input-media.js'
import { _normalizeInputText } from '../misc/normalize-text.js'

/**
 * Edit sent inline message text, media and reply markup.
 *
 * @param messageId
 *     Inline message ID, either as a TL object, or as a
 *     TDLib and Bot API compatible string
 * @param params
 */
export async function editInlineMessage(
    client: ITelegramClient,
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
        text?: InputText

        /**
         * New message media
         */
        media?: InputMediaLike

        /**
         * Whether to disable links preview in this message
         */
        disableWebPreview?: boolean

        /**
         * Whether to invert media position.
         *
         * Currently only supported for web previews and makes the
         * client render the preview above the caption and not below.
         */
        invertMedia?: boolean

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
            [content, entities] = await _normalizeInputText(client, params.media.caption)
        }
    } else if (params.text) {
        [content, entities] = await _normalizeInputText(client, params.text)
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
                    invertMedia: params.invertMedia,
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
