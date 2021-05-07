import { TelegramClient } from '../../client'
import {
    BotKeyboard,
    InputMediaLike,
    InputPeerLike,
    Message,
    ReplyMarkup,
} from '../../types'
import { normalizeToInputPeer } from '../../utils/peer-utils'
import { normalizeDate, randomUlong } from '../../utils/misc-utils'

/**
 * Send a single media (a photo or a document-based media)
 *
 * @param chatId  ID of the chat, its username, phone or `"me"` or `"self"`
 * @param media
 *     Media contained in the message. You can also pass TDLib
 *     and Bot API compatible File ID, which will be wrapped
 *     in {@link InputMedia.auto}
 * @param params  Additional sending parameters
 * @link InputMedia
 * @internal
 */
export async function sendMedia(
    this: TelegramClient,
    chatId: InputPeerLike,
    media: InputMediaLike | string,
    params?: {
        /**
         * Message to reply to. Either a message object or message ID.
         */
        replyTo?: number | Message

        /**
         * Parse mode to use to parse entities before sending
         * the message. Defaults to current default parse mode (if any).
         *
         * Passing `null` will explicitly disable formatting.
         */
        parseMode?: string | null

        /**
         * Whether to send this message silently.
         */
        silent?: boolean

        /**
         * If set, the message will be scheduled to this date.
         * When passing a number, a UNIX time in ms is expected.
         */
        schedule?: Date | number

        /**
         * For bots: inline or reply markup or an instruction
         * to hide a reply keyboard or to force a reply.
         */
        replyMarkup?: ReplyMarkup

        /**
         * Function that will be called after some part has been uploaded.
         * Only used when a file that requires uploading is passed,
         * and not used when uploading a thumbnail.
         *
         * @param uploaded  Number of bytes already uploaded
         * @param total  Total file size
         */
        progressCallback?: (uploaded: number, total: number) => void

        /**
         * Whether to clear draft after sending this message.
         *
         * Defaults to `false`
         */
        clearDraft?: boolean
    }
): Promise<Message> {
    if (!params) params = {}

    if (typeof media === 'string') {
        media = {
            type: 'auto',
            file: media,
        }
    }

    const inputMedia = await this._normalizeInputMedia(media, params)

    const [message, entities] = await this._parseEntities(
        // some types dont have `caption` field, and ts warns us,
        // but since it's JS, they'll just be `undefined` and properly
        // handled by _parseEntities method
        (media as any).caption,
        params.parseMode,
        (media as any).entities
    )

    const peer = normalizeToInputPeer(await this.resolvePeer(chatId))
    const replyMarkup = BotKeyboard._convertToTl(params.replyMarkup)

    const res = await this.call({
        _: 'messages.sendMedia',
        peer,
        media: inputMedia,
        silent: params.silent,
        replyToMsgId: params.replyTo
            ? typeof params.replyTo === 'number'
                ? params.replyTo
                : params.replyTo.id
            : undefined,
        randomId: randomUlong(),
        scheduleDate: normalizeDate(params.schedule),
        replyMarkup,
        message,
        entities,
        clearDraft: params.clearDraft,
    })

    return this._findMessageInUpdate(res)
}
