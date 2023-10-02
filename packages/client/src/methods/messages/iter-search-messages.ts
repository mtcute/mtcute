import { TelegramClient } from '../../client'
import { Message, SearchFilters } from '../../types'
import { normalizeDate } from '../../utils/misc-utils'

/**
 * Search for messages inside a specific chat
 *
 * Iterable version of {@link searchMessages}
 *
 * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`.
 * @param params  Additional search parameters
 * @internal
 */
export async function* iterSearchMessages(
    this: TelegramClient,
    params?: Parameters<TelegramClient['searchMessages']>[0] & {
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
    const peer = await this.resolvePeer(chatId)
    const fromUser = params.fromUser ? await this.resolvePeer(params.fromUser) : undefined

    let { offset, addOffset } = params
    let current = 0

    for (;;) {
        const res = await this.searchMessages({
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
