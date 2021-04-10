import { BotKeyboard, InputPeerLike, Message, ReplyMarkup } from '../../types'
import { TelegramClient } from '../../client'
import { normalizeToInputPeer } from '../../utils/peer-utils'
import { normalizeDate, randomUlong } from '../../utils/misc-utils'

/**
 * Send a static geo location.
 *
 * @param chatId  ID of the chat, its username, phone or `"me"` or `"self"`
 * @param latitude  Latitude of the location
 * @param longitude  Longitude of the location
 * @param params  Additional sending parameters
 * @internal
 */
export async function sendLocation(
    this: TelegramClient,
    chatId: InputPeerLike,
    latitude: number,
    longitude: number,
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
            _: 'inputMediaGeoPoint',
            geoPoint: {
                _: 'inputGeoPoint',
                lat: latitude,
                long: longitude
            }
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
        message: '',
    })

    return this._findMessageInUpdate(res)
}
