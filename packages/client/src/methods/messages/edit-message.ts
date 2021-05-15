import { TelegramClient } from '../../client'
import {
    BotKeyboard,
    InputMediaLike,
    InputPeerLike,
    Message,
    ReplyMarkup,
} from '../../types'
import { tl } from '@mtcute/tl'

/**
 * Edit message text, media, reply markup and schedule date.
 *
 * @param chatId  ID of the chat, its username, phone or `"me"` or `"self"`
 * @param message  Message or its ID
 * @param params
 * @internal
 */
export async function editMessage(
    this: TelegramClient,
    chatId: InputPeerLike,
    message: number | Message,
    params: {
        /**
         * New message text
         *
         * When `media` is passed, `media.caption` is used instead
         */
        text?: string

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
    }
): Promise<Message> {
    let content: string | undefined
    let entities: tl.TypeMessageEntity[] | undefined
    let media: tl.TypeInputMedia | undefined = undefined

    if (params.media) {
        media = await this._normalizeInputMedia(params.media, params)

        // if there's no caption in input media (i.e. not present or undefined),
        // user wants to keep current caption, thus `content` needs to stay `undefined`
        if ('caption' in params.media && params.media.caption !== undefined) {
            ;[content, entities] = await this._parseEntities(
                params.media.caption,
                params.parseMode,
                params.media.entities
            )
        }
    } else {
        ;[content, entities] = await this._parseEntities(
            params.text,
            params.parseMode,
            params.entities
        )
    }

    const res = await this.call({
        _: 'messages.editMessage',
        id: typeof message === 'number' ? message : message.id,
        peer: await this.resolvePeer(chatId),
        noWebpage: params.disableWebPreview,
        replyMarkup: BotKeyboard._convertToTl(params.replyMarkup),
        message: content,
        entities,
        media,
    })

    return this._findMessageInUpdate(res, true) as any
}
