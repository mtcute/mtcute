import Long from 'long'

import { tl } from '@mtcute/tl'

import { assertTypeIsNot } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'
import { ArrayPaginated, InputPeerLike, Message, PeersIndex } from '../../types/index.js'
import { makeArrayPaginated } from '../../utils/index.js'
import { resolvePeer } from '../users/resolve-peer.js'

// @exported
export interface GetHistoryOffset {
    id: number
    date: number
}

const defaultOffset: GetHistoryOffset = {
    id: 0,
    date: 0,
}

const defaultOffsetReverse: GetHistoryOffset = {
    id: 1,
    date: 0,
}

/**
 * Get chat history.
 *
 * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`.
 * @param params  Additional fetch parameters
 */
export async function getHistory(
    client: ITelegramClient,
    chatId: InputPeerLike,
    params?: {
        /**
         * Limits the number of messages to be retrieved.
         *
         * @default  100
         */
        limit?: number

        /**
         * Offset for pagination
         */
        offset?: GetHistoryOffset

        /**
         * Additional offset from {@link offset}, in resulting messages.
         *
         * This can be used for advanced use cases, like:
         * - Loading 20 messages newer than message with ID `MSGID`:
         *   `offset = MSGID, addOffset = -20, limit = 20`
         * - Loading 20 messages around message with ID `MSGID`:
         *   `offset = MSGID, addOffset = -10, limit = 20`
         *
         * @default  `0` (disabled)
         */

        addOffset?: number

        /**
         * Minimum message ID to return
         *
         * @default  `0` (disabled).
         */
        minId?: number

        /**
         * Maximum message ID to return.
         *
         * Unless {@link addOffset} is used, this will work the same as {@link offset}.
         *
         * @default  `0` (disabled).
         */
        maxId?: number

        /**
         * Whether to retrieve messages in reversed order (from older to recent),
         * starting from {@link offset} (inclusive).
         *
         * > **Note**: Using `reverse=true` requires you to pass offset from which to start
         * > fetching the messages "downwards". If you call `getHistory` with `reverse=true`
         * > and without any offset, it will return an empty array.
         *
         * @default false
         */
        reverse?: boolean
    },
): Promise<ArrayPaginated<Message, GetHistoryOffset>> {
    if (!params) params = {}

    const {
        reverse = false,
        limit = 100,
        offset: { id: offsetId, date: offsetDate } = reverse ? defaultOffsetReverse : defaultOffset,
        addOffset = 0,
        minId = 0,
        maxId = 0,
    } = params

    const addOffsetAdjusted = addOffset + (reverse ? -limit : 0)

    const peer = await resolvePeer(client, chatId)

    const res = await client.call({
        _: 'messages.getHistory',
        peer,
        offsetId,
        offsetDate,
        addOffset: addOffsetAdjusted,
        limit,
        maxId,
        minId,
        hash: Long.ZERO,
    })

    assertTypeIsNot('getHistory', res, 'messages.messagesNotModified')

    const peers = PeersIndex.from(res)
    const msgs = res.messages.filter((msg) => msg._ !== 'messageEmpty').map((msg) => new Message(msg, peers))

    if (reverse) msgs.reverse()

    const last = msgs[msgs.length - 1]
    const next = last ?
        {
            id: last.id + (reverse ? 1 : 0),
            date: last.raw.date,
        } :
        undefined

    return makeArrayPaginated(msgs, (res as tl.messages.RawMessagesSlice).count ?? msgs.length, next)
}
