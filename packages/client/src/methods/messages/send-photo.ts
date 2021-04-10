import {
    InputPeerLike,
    InputFileLike,
    Message,
    BotKeyboard,
    ReplyMarkup,
    isUploadedFile,
    filters,
    Photo,
} from '../../types'
import { tl } from '@mtcute/tl'
import { TelegramClient } from '../../client'
import { normalizeToInputPeer } from '../../utils/peer-utils'
import { normalizeDate, randomUlong } from '../../utils/misc-utils'

/**
 * Send a single photo
 *
 * @param chatId  ID of the chat, its username, phone or `"me"` or `"self"`
 * @param photo  Photo contained in the message.
 * @param params  Additional sending parameters
 * @internal
 */
export async function sendPhoto(
    this: TelegramClient,
    chatId: InputPeerLike,
    photo: InputFileLike,
    params?: {
        /**
         * Caption for the photo
         */
        caption?: string

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
         * List of formatting entities to use instead of parsing via a
         * parse mode.
         *
         * **Note:** Passing this makes the method ignore {@link parseMode}
         */
        entities?: tl.TypeMessageEntity[]

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
         * Self-Destruct timer.
         * If set, the photo will self-destruct in a given number
         * of seconds.
         */
        ttlSeconds?: number

        /**
         * Function that will be called after some part has been uploaded.
         * Only used when a file that requires uploading is passed.
         *
         * @param uploaded  Number of bytes already uploaded
         * @param total  Total file size
         */
        progressCallback?: (uploaded: number, total: number) => void
    }
): Promise<Message> {
    if (!params) params = {}

    let media: tl.TypeInputMedia
    if (typeof photo === 'string' && photo.match(/^https?:\/\//)) {
        media = {
            _: 'inputMediaPhotoExternal',
            url: photo,
            ttlSeconds: params.ttlSeconds,
        }
    } else if (isUploadedFile(photo)) {
        media = {
            _: 'inputMediaUploadedPhoto',
            file: photo.inputFile,
            ttlSeconds: params.ttlSeconds,
        }
    } else if (typeof photo === 'object' && tl.isAnyInputFile(photo)) {
        media = {
            _: 'inputMediaUploadedPhoto',
            file: photo,
            ttlSeconds: params.ttlSeconds,
        }
    } else {
        const uploaded = await this.uploadFile({
            file: photo,
            progressCallback: params.progressCallback,
        })
        media = {
            _: 'inputMediaUploadedPhoto',
            file: uploaded.inputFile,
            ttlSeconds: params.ttlSeconds,
        }
    }

    const [message, entities] = await this._parseEntities(
        params.caption,
        params.parseMode,
        params.entities
    )

    const peer = normalizeToInputPeer(await this.resolvePeer(chatId))
    const replyMarkup = BotKeyboard._convertToTl(params.replyMarkup)

    const res = await this.call({
        _: 'messages.sendMedia',
        media,
        peer,
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
    })

    return this._findMessageInUpdate(res)
}
