import { TelegramClient } from '../../client'
import { tl } from '@mtcute/tl'
import { inputPeerToPeer, normalizeToInputPeer } from '../../utils/peer-utils'
import { normalizeDate, randomUlong } from '../../utils/misc-utils'
import {
    InputPeerLike,
    Message,
    BotKeyboard,
    ReplyMarkup,
} from '../../types'

/**
 * Send a text message
 *
 * @param chatId  ID of the chat, its username, phone or `"me"` or `"self"`
 * @param text  Text of the message
 * @param params  Additional sending parameters
 * @internal
 */
export async function sendText(
    this: TelegramClient,
    chatId: InputPeerLike,
    text: string,
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
         * List of formatting entities to use instead of parsing via a
         * parse mode.
         *
         * **Note:** Passing this makes the method ignore {@link parseMode}
         */
        entities?: tl.TypeMessageEntity[]

        /**
         * Whether to disable links preview in this message
         */
        disableWebPreview?: boolean

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
    }
): Promise<Message> {
    if (!params) params = {}

    const [message, entities] = await this._parseEntities(
        text,
        params.parseMode,
        params.entities
    )

    const peer = normalizeToInputPeer(await this.resolvePeer(chatId))
    const replyMarkup = BotKeyboard._convertToTl(params.replyMarkup)

    const res = await this.call({
        _: 'messages.sendMessage',
        peer,
        noWebpage: params.disableWebPreview,
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

    if (res._ === 'updateShortSentMessage') {
        const msg: tl.RawMessage = {
            _: 'message',
            id: res.id,
            peerId: inputPeerToPeer(peer),
            message,
            date: res.date,
            out: res.out,
            replyMarkup,
            entities: res.entities,
        }

        return new Message(this, msg, {}, {})
    }

    return this._findMessageInUpdate(res)
}
