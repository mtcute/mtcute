import { BaseTelegramClient } from '@mtcute/core'

import { ForumTopic, InputPeerLike } from '../../types'
import { normalizeToInputChannel } from '../../utils/peer-utils'
import { resolvePeer } from '../users/resolve-peer'
import { getForumTopics } from './get-forum-topics'

/**
 * Iterate over forum topics. Wrapper over {@link getForumTopics}.
 *
 * @param chatId  Chat ID or username
 */
export async function* iterForumTopics(
    client: BaseTelegramClient,
    chatId: InputPeerLike,
    params?: Parameters<typeof getForumTopics>[2] & {
        /**
         * Maximum number of topics to return.
         *
         * @default  `Infinity`, i.e. return all topics
         */
        limit?: number

        /**
         * Chunk size. Usually you shouldn't care about this.
         */
        chunkSize?: number
    },
): AsyncIterableIterator<ForumTopic> {
    if (!params) params = {}

    const { query, limit = Infinity, chunkSize = 100 } = params

    const peer = normalizeToInputChannel(await resolvePeer(client, chatId))

    let { offset } = params
    let current = 0

    for (;;) {
        const res = await getForumTopics(client, peer, {
            query,
            offset,
            limit: Math.min(chunkSize, limit - current),
        })

        for (const topic of res) {
            yield topic

            if (++current >= limit) return
        }

        if (!res.next) return
        offset = res.next
    }
}
