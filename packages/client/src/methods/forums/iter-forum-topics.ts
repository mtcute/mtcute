import { TelegramClient } from '../../client'
import { ForumTopic, InputPeerLike } from '../../types'
import { normalizeToInputChannel } from '../../utils/peer-utils'

/**
 * Iterate over forum topics. Wrapper over {@link getForumTopics}.
 *
 * @param chatId  Chat ID or username
 * @internal
 */
export async function* iterForumTopics(
    this: TelegramClient,
    chatId: InputPeerLike,
    params?: Parameters<TelegramClient['getForumTopics']>[1] & {
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

    const peer = normalizeToInputChannel(await this.resolvePeer(chatId))

    let { offset } = params
    let current = 0

    for (;;) {
        const res = await this.getForumTopics(peer, {
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
