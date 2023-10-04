import { Long, tl } from '@mtcute/core'

import { TelegramClient } from '../../client'
import { ChatEvent, InputPeerLike } from '../../types'
import { normalizeChatEventFilters } from '../../types/peers/chat-event/filters'
import { normalizeToInputChannel, normalizeToInputUser } from '../../utils/peer-utils'

/**
 * Iterate over chat event log.
 *
 * Small wrapper over {@link getChatEventLog}
 *
 * @param chatId  Chat ID
 * @param params
 * @internal
 */
export async function* iterChatEventLog(
    this: TelegramClient,
    chatId: InputPeerLike,
    params?: Parameters<TelegramClient['getChatEventLog']>[1] & {
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

    const channel = normalizeToInputChannel(await this.resolvePeer(chatId), chatId)

    const { minId = Long.ZERO, query = '', limit = Infinity, chunkSize = 100, users, filters } = params

    const admins: tl.TypeInputUser[] | undefined = users ?
        await this.resolvePeerMany(users, normalizeToInputUser) :
        undefined

    const { serverFilter, localFilter } = normalizeChatEventFilters(filters)

    let current = 0
    let maxId = params.maxId ?? Long.ZERO

    for (;;) {
        const chunk = await this.getChatEventLog(channel, {
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
