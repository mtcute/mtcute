import { BaseTelegramClient, tl } from '@mtcute/core'

import {
    BotKeyboard,
    FormattedString,
    InputMediaLike,
    InputMessageId,
    Message,
    normalizeInputMessageId,
    ReplyMarkup,
} from '../../types/index.js'
import { _normalizeInputMedia } from '../files/normalize-input-media.js'
import { resolvePeer } from '../users/resolve-peer.js'
import { _findMessageInUpdate } from './find-in-update.js'
import { _parseEntities } from './parse-entities.js'

/**
 * Edit message text, media, reply markup and schedule date.
 *
 * @param chatId  ID of the chat, its username, phone or `"me"` or `"self"`
 * @param message  Message or its ID
 * @param params
 */
export async function editMessage(
    client: BaseTelegramClient,
    params: InputMessageId & {
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
         * To re-schedule a message: new schedule date.
         * When passing a number, a UNIX time in ms is expected.
         */
        scheduleDate?: Date | number

        /**
         * For media, upload progress callback.
         *
         * @param uploaded  Number of bytes uploaded
         * @param total  Total file size in bytes
         */
        progressCallback?: (uploaded: number, total: number) => void

        /**
         * Whether to dispatch the edit message event
         * to the client's update handler.
         */
        shouldDispatch?: true

        /**
         * Whether to invert media position.
         *
         * Currently only supported for web previews and makes the
         * client render the preview above the caption and not below.
         */
        invertMedia?: boolean
    },
): Promise<Message> {
    const { chatId, message } = normalizeInputMessageId(params)
    let content: string | undefined = undefined
    let entities: tl.TypeMessageEntity[] | undefined
    let media: tl.TypeInputMedia | undefined = undefined

    if (params.media) {
        media = await _normalizeInputMedia(client, params.media, params)

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
    }

    if (params.text) {
        [content, entities] = await _parseEntities(client, params.text, params.parseMode, params.entities)
    }

    const res = await client.call({
        _: 'messages.editMessage',
        id: message,
        peer: await resolvePeer(client, chatId),
        noWebpage: params.disableWebPreview,
        replyMarkup: BotKeyboard._convertToTl(params.replyMarkup),
        message: content,
        entities,
        media,
        invertMedia: params.invertMedia,
    })

    return _findMessageInUpdate(client, res, true, !params.shouldDispatch)
}
