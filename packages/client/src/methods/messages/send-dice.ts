import { TelegramClient } from '../../client'
import { BotKeyboard, InputPeerLike, Message, ReplyMarkup } from '../../types'
import { normalizeDate, randomUlong } from '../../utils/misc-utils'
import { normalizeToInputPeer } from '../../utils/peer-utils'

/**
 * Send an animated dice with a random value.
 *
 * For convenience, known dice emojis are available
 * as static members of {@link Dice}.
 *
 * Note that dice result value is generated randomly on the server,
 * you can't influence it in any way!
 *
 * @param chatId  ID of the chat, its username, phone or `"me"` or `"self"`
 * @param emoji  Emoji representing a dice
 * @param params  Additional sending parameters
 * @link Dice
 * @internal
 */
export async function sendDice(
    this: TelegramClient,
    chatId: InputPeerLike,
    emoji: string,
    params?: {
        /**
         * Message to reply to. Either a message object or message ID.
         */
        replyTo?: number | Message

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

    const peer = normalizeToInputPeer(await this.resolvePeer(chatId))
    const replyMarkup = BotKeyboard._convertToTl(params.replyMarkup)

    const res = await this.call({
        _: 'messages.sendMedia',
        peer,
        media: {
            _: 'inputMediaDice',
            emoticon: emoji
        },
        silent: params.silent,
        replyToMsgId: params.replyTo
            ? typeof params.replyTo === 'number'
                ? params.replyTo
                : params.replyTo.id
            : undefined,
        randomId: randomUlong(),
        scheduleDate: normalizeDate(params.schedule),
        replyMarkup,
        message: ''
    })

    return this._findMessageInUpdate(res)
}
