import { TelegramClient } from '../../client'
import {
    BotKeyboard,
    FormattedString,
    InputMediaLike,
    InputPeerLike,
    Message,
    MtArgumentError,
    ReplyMarkup,
} from '../../types'
import { normalizeDate, normalizeMessageId } from '../../utils/misc-utils'
import { tl } from '@mtcute/tl'
import { randomLong } from '@mtcute/core'

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
         * Override caption for `media`.
         *
         * Can be used, for example. when using File IDs
         * or when using existing InputMedia objects.
         */
        caption?: string | FormattedString<any>

        /**
         * Override entities for `media`.
         *
         * Can be used, for example. when using File IDs
         * or when using existing InputMedia objects.
         */
        entities?: tl.TypeMessageEntity[]

        /**
         * Message to reply to. Either a message object or message ID.
         */
        replyTo?: number | Message

        /**
         * Whether to throw an error if {@link replyTo}
         * message does not exist.
         *
         * If that message was not found, `NotFoundError` is thrown,
         * with `text` set to `MESSAGE_NOT_FOUND`.
         *
         * Incurs an additional request, so only use when really needed.
         *
         * Defaults to `false`
         */
        mustReply?: boolean

        /**
         * Message to comment to. Either a message object or message ID.
         *
         * This overwrites `replyTo` if it was passed
         */
        commentTo?: number | Message

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
         *
         * You can also pass `0x7FFFFFFE`, this will send the message
         * once the peer is online
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

        /**
         * Whether to disallow further forwards of this message.
         *
         * Only for bots, works even if the target chat does not
         * have content protection.
         */
        forbidForwards?: boolean
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
        params.caption || (media as any).caption,
        params.parseMode,
        params.entities || (media as any).entities
    )

    let peer = await this.resolvePeer(chatId)
    const replyMarkup = BotKeyboard._convertToTl(params.replyMarkup)

    let replyTo = normalizeMessageId(params.replyTo)
    if (params.commentTo) {
        ;[peer, replyTo] = await this._getDiscussionMessage(
            peer,
            normalizeMessageId(params.commentTo)!
        )
    }

    if (params.mustReply) {
        if (!replyTo)
            throw new MtArgumentError(
                'mustReply used, but replyTo was not passed'
            )

        const msg = await this.getMessages(peer, replyTo)

        if (!msg) throw new tl.errors.MessageNotFoundError()
    }

    const res = await this.call({
        _: 'messages.sendMedia',
        peer,
        media: inputMedia,
        silent: params.silent,
        replyToMsgId: replyTo,
        randomId: randomLong(),
        scheduleDate: normalizeDate(params.schedule),
        replyMarkup,
        message,
        entities,
        clearDraft: params.clearDraft,
        noforwards: params.forbidForwards
    })

    const msg = this._findMessageInUpdate(res)

    this._pushConversationMessage(msg)

    return msg
}
