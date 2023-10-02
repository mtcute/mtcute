import { TelegramClient } from '../../client'
import { Message, SearchFilters } from '../../types'
import { normalizeDate } from '../../utils'

/**
 * Search for messages globally from all of your chats.
 *
 * Iterable version of {@link searchGlobal}
 *
 * **Note**: Due to Telegram limitations, you can only get up to ~10000 messages
 *
 * @param params  Search parameters
 * @internal
 */
export async function* iterSearchGlobal(
    this: TelegramClient,
    params?: Parameters<TelegramClient['searchGlobal']>[0] & {
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

    const { query = '', filter = SearchFilters.Empty, limit = Infinity, chunkSize = 100 } = params

    const minDate = normalizeDate(params.minDate) ?? 0
    const maxDate = normalizeDate(params.maxDate) ?? 0

    let { offset } = params
    let current = 0

    for (;;) {
        const res = await this.searchGlobal({
            query,
            filter,
            limit: Math.min(chunkSize, limit - current),
            minDate,
            maxDate,
            offset,
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
