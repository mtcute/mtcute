import { tl } from '@mtcute/tl'

import { TelegramClient } from '../../client'
import {
    InputPeerLike,
    Message,
    FormattedString,
    ReplyMarkup,
} from '../../types'

/**
 * Copy a message (i.e. send the same message,
 * but do not forward it).
 *
 * Note that if the message contains a webpage,
 * it will be copied simply as a text message,
 * and if the message contains an invoice,
 * it can't be copied.
 *
 * > **Note**: if you already have {@link Message} object,
 * > use {@link Message.sendCopy} instead, since that is
 * > much more efficient, and that is what this method wraps.
 *
 * @param toChatId  Source chat ID
 * @param fromChatId  Target chat ID
 * @param message  Message ID to forward
 * @param params
 * @internal
 */
export async function sendCopy(
    this: TelegramClient,
    toChatId: InputPeerLike,
    fromChatId: InputPeerLike,
    message: number,
    params?: {
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
         * New message caption (only used for media)
         */
        caption?: string | FormattedString<any>

        /**
         * Parse mode to use to parse `text` entities before sending
         * the message. Defaults to current default parse mode (if any).
         *
         * Passing `null` will explicitly disable formatting.
         */
        parseMode?: string | null

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
         * List of formatting entities to use instead of parsing via a
         * parse mode.
         *
         * **Note:** Passing this makes the method ignore {@link parseMode}
         */
        entities?: tl.TypeMessageEntity[]

        /**
         * For bots: inline or reply markup or an instruction
         * to hide a reply keyboard or to force a reply.
         */
        replyMarkup?: ReplyMarkup

        /**
         * Whether to clear draft after sending this message.
         *
         * Defaults to `false`
         */
        clearDraft?: boolean
    }
): Promise<Message> {
    const fromPeer = await this.resolvePeer(fromChatId)

    const msg = await this.getMessages(fromPeer, message)

    if (!msg) throw new tl.errors.MessageNotFoundError()

    return msg.sendCopy(toChatId, params)
}
