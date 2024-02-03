import { ITelegramClient } from '../../client.types.js'
import { Message, SearchFilters } from '../../types/index.js'
import { normalizeDate } from '../../utils/misc-utils.js'
import { resolvePeer } from '../users/resolve-peer.js'
import { searchMessages } from './search-messages.js'

/**
 * Search for messages inside a specific chat
 *
 * Iterable version of {@link searchMessages}
 *
 * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`.
 * @param params  Additional search parameters
 */
export async function* iterSearchMessages(
    client: ITelegramClient,
    params?: Parameters<typeof searchMessages>[1] & {
        /**
         * Limits the number of messages to be retrieved.
         *
         * @default  `Infinity`, i.e. all messages are returned
         */
        limit?: number

        /**
         * Chunk size, which will be passed as `limit` parameter
         * for `messages.search`. Usually you shouldn't care about this.
         *
         * @default  `100`
         */
        chunkSize?: number
    },
): AsyncIterableIterator<Message> {
    if (!params) params = {}

    const {
        query = '',
        chatId = { _: 'inputPeerEmpty' },
        minId = 0,
        maxId = 0,
        threadId,
        limit = Infinity,
        chunkSize = 100,
        filter = SearchFilters.Empty,
    } = params

    const minDate = normalizeDate(params.minDate) ?? 0
    const maxDate = normalizeDate(params.maxDate) ?? 0
    const peer = await resolvePeer(client, chatId)
    const fromUser = params.fromUser ? await resolvePeer(client, params.fromUser) : undefined

    let { offset, addOffset } = params
    let current = 0

    for (;;) {
        const res = await searchMessages(client, {
            query,
            chatId: peer,
            offset,
            addOffset,
            minId,
            maxId,
            threadId,
            filter,
            fromUser,
            minDate,
            maxDate,
            limit: Math.min(chunkSize, limit - current),
        })

        if (!res.length) break

        for (const msg of res) {
            yield msg

            if (++current >= limit) return
        }

        if (!res.next) break
        offset = res.next
        addOffset = undefined
    }
}
