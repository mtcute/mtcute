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
import { tl } from '@mtcute/tl'

/**
 * Send a group of media.
 *
 * @param chatId  ID of the chat, its username, phone or `"me"` or `"self"`
 * @param medias  Medias contained in the message.
 * @param params  Additional sending parameters
 * @link InputMedia
 * @internal
 */
export async function sendMediaGroup(
    this: TelegramClient,
    chatId: InputPeerLike,
    medias: InputMediaLike[],
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
         * @param index  Index of the media in the original array
         * @param uploaded  Number of bytes already uploaded
         * @param total  Total file size
         */
        progressCallback?: (
            index: number,
            uploaded: number,
            total: number
        ) => void

        /**
         * Whether to clear draft after sending this message.
         *
         * Defaults to `false`
         */
        clearDraft?: boolean
    }
): Promise<Message> {
    if (!params) params = {}

    const peer = normalizeToInputPeer(await this.resolvePeer(chatId))
    const replyMarkup = BotKeyboard._convertToTl(params.replyMarkup)

    const multiMedia: tl.RawInputSingleMedia[] = []

    for (let i = 0; i < medias.length; i++) {
        const media = medias[i]
        const inputMedia = await this._normalizeInputMedia(media, {
            progressCallback: params.progressCallback?.bind(null, i),
        })

        const [message, entities] = await this._parseEntities(
            // some types dont have `caption` field, and ts warns us,
            // but since it's JS, they'll just be `undefined` and properly
            // handled by _parseEntities method
            (media as any).caption,
            params.parseMode,
            (media as any).entities
        )

        multiMedia.push({
            _: 'inputSingleMedia',
            randomId: randomUlong(),
            media: inputMedia,
            message,
            entities,
        })
    }

    const res = await this.call({
        _: 'messages.sendMultiMedia',
        peer,
        multiMedia,
        silent: params.silent,
        replyToMsgId: params.replyTo
            ? typeof params.replyTo === 'number'
                ? params.replyTo
                : params.replyTo.id
            : undefined,
        randomId: randomUlong(),
        scheduleDate: normalizeDate(params.schedule),
        replyMarkup,
        clearDraft: params.clearDraft,
    })

    return this._findMessageInUpdate(res)
}
