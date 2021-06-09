import { TelegramClient } from '../../client'
import { InputPeerLike, Message, MtCuteTypeAssertionError } from '../../types'
import { createUsersChatsIndex } from '../../utils/peer-utils'
import { normalizeDate } from '../../utils/misc-utils'

/**
 * Retrieve a chunk of the chat history.
 *
 * You can get up to 100 messages with one call.
 * For larger chunks, use {@link iterHistory}.
 *
 * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`.
 * @param params  Additional fetch parameters
 * @internal
 */
export async function getHistory(
    this: TelegramClient,
    chatId: InputPeerLike,
    params?: {
        /**
         * Limits the number of messages to be retrieved.
         *
         * Defaults to `100`.
         */
        limit?: number

        /**
         * Sequential number of the first message to be returned.
         * Defaults to 0 (most recent message).
         *
         * Negative values are also accepted and are useful
         * in case you set `offsetId` or `offsetDate`.
         */
        offset?: number

        /**
         * Pass a message identifier as an offset to retrieve
         * only older messages starting from that message
         */
        offsetId?: number

        /**
         * Pass a date (`Date` or Unix time in ms) as an offset to retrieve
         * only older messages starting from that date.
         */
        offsetDate?: number | Date

        /**
         * Pass `true` to retrieve messages in reversed order (from older to recent)
         */
        reverse?: boolean
    }
): Promise<Message[]> {
    if (!params) params = {}

    const offsetId =
        params.offsetId ?? (params.reverse && !params.offsetDate ? 1 : 0)
    const limit = params.limit || 100

    const peer = await this.resolvePeer(chatId)

    const res = await this.call({
        _: 'messages.getHistory',
        peer,
        offsetId,
        offsetDate: normalizeDate(params.offsetDate) || 0,
        addOffset:
            (params.offset ? params.offset * (params.reverse ? -1 : 1) : 0) -
            (params.reverse ? limit : 0),
        limit,
        maxId: 0,
        minId: 0,
        hash: 0,
    })

    if (res._ === 'messages.messagesNotModified')
        throw new MtCuteTypeAssertionError(
            'messages.getHistory',
            '!messages.messagesNotModified',
            res._
        )

    const { users, chats } = createUsersChatsIndex(res)

    const msgs = res.messages
        .filter((msg) => msg._ !== 'messageEmpty')
        .map((msg) => new Message(this, msg, users, chats))

    if (params.reverse) msgs.reverse()

    return msgs
}
