import Long from 'long'

import { tl } from '@mtcute/tl'

import { ITelegramClient } from '../../client.types.js'
import { ChatEvent, InputPeerLike } from '../../types/index.js'
import { normalizeChatEventFilters } from '../../types/peers/chat-event/filters.js'
import { toInputUser } from '../../utils/peer-utils.js'
import { resolveChannel } from '../users/resolve-peer.js'
import { resolvePeerMany } from '../users/resolve-peer-many.js'
import { getChatEventLog } from './get-chat-event-log.js'

/**
 * Iterate over chat event log.
 *
 * Small wrapper over {@link getChatEventLog}
 *
 * @param chatId  Chat ID
 * @param params
 */
export async function* iterChatEventLog(
    client: ITelegramClient,
    chatId: InputPeerLike,
    params?: Parameters<typeof getChatEventLog>[2] & {
        /**
         * Total number of events to return.
         *
         * @default  Infinity
         */
        limit?: number

        /**
         * Chunk size, passed as `limit` to {@link getChatEventLog}.
         * Usually you don't need to touch this.
         *
         * @default  100
         */
        chunkSize?: number
    },
): AsyncIterableIterator<ChatEvent> {
    if (!params) params = {}

    const channel = await resolveChannel(client, chatId)

    const { minId = Long.ZERO, query = '', limit = Infinity, chunkSize = 100, users, filters } = params

    const admins: tl.TypeInputUser[] | undefined = users ? await resolvePeerMany(client, users, toInputUser) : undefined

    const { serverFilter, localFilter } = normalizeChatEventFilters(filters)

    let current = 0
    let maxId = params.maxId ?? Long.ZERO

    for (;;) {
        const chunk = await getChatEventLog(client, channel, {
            minId,
            maxId,
            query,
            limit: localFilter ? chunkSize : Math.min(limit - current, chunkSize),
            // provide already resolved users to avoid resolving them again
            users: admins,
            // local filters may mess with pagination
            filters: { serverFilter },
        })

        if (!chunk.length) break

        const last = chunk[chunk.length - 1]
        maxId = last.id

        for (const item of chunk) {
            if (localFilter && (!item.action || !localFilter[item.action.type])) {
                continue
            }

            current += 1
            yield item

            if (current >= limit) break
        }
    }
}
