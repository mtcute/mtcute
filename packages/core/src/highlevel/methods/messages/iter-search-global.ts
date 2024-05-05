import { ITelegramClient } from '../../client.types.js'
import { Message, SearchFilters } from '../../types/index.js'
import { normalizeDate } from '../../utils/index.js'
import { searchGlobal } from './search-global.js'

/**
 * Search for messages globally from all of your chats.
 *
 * Iterable version of {@link searchGlobal}
 *
 * **Note**: Due to Telegram limitations, you can only get up to ~10000 messages
 *
 * @param params  Search parameters
 */
export async function* iterSearchGlobal(
    client: ITelegramClient,
    params?: Parameters<typeof searchGlobal>[1] & {
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
         * @default  100
         */
        chunkSize?: number
    },
): AsyncIterableIterator<Message> {
    if (!params) params = {}

    const { query = '', filter = SearchFilters.Empty, limit = Infinity, chunkSize = 100, onlyChannels } = params

    const minDate = normalizeDate(params.minDate) ?? 0
    const maxDate = normalizeDate(params.maxDate) ?? 0

    let { offset } = params
    let current = 0

    for (;;) {
        const res = await searchGlobal(client, {
            query,
            filter,
            limit: Math.min(chunkSize, limit - current),
            minDate,
            maxDate,
            offset,
            onlyChannels,
        })

        if (!res.length) return

        for (const msg of res) {
            yield msg

            if (++current >= limit) return
        }

        if (!res.next) return
        offset = res.next
    }
}
