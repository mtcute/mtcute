import { BaseTelegramClient } from '@mtcute/core'

import { ArrayPaginated, ForumTopic, InputPeerLike } from '../../types/index.js'
import { makeArrayPaginated } from '../../utils/index.js'
import { toInputChannel } from '../../utils/peer-utils.js'
import { resolvePeer } from '../users/resolve-peer.js'

// @exported
export interface GetForumTopicsOffset {
    date: number
    id: number
    topic: number
}

const defaultOffset: GetForumTopicsOffset = {
    date: 0,
    id: 0,
    topic: 0,
}

/**
 * Get forum topics
 *
 * @param chatId  Chat ID or username
 */
export async function getForumTopics(
    client: BaseTelegramClient,
    chatId: InputPeerLike,
    params?: {
        /**
         * Search query
         */
        query?: string

        /**
         * Offset for pagination
         */
        offset?: GetForumTopicsOffset

        /**
         * Maximum number of topics to return.
         *
         * @default  100
         */
        limit?: number
    },
): Promise<ArrayPaginated<ForumTopic, GetForumTopicsOffset>> {
    if (!params) params = {}

    const {
        query,
        offset: { date: offsetDate, id: offsetId, topic: offsetTopic } = defaultOffset,
        limit = 100,
    } = params

    const res = await client.call({
        _: 'channels.getForumTopics',
        channel: toInputChannel(await resolvePeer(client, chatId), chatId),
        q: query,
        offsetDate,
        offsetId,
        offsetTopic,
        limit,
    })

    const topics = ForumTopic.parseTlForumTopics(res)

    const last = topics[topics.length - 1]
    const next = last ?
        {
            date: res.orderByCreateDate ? last.raw.date : last.lastMessage.raw.date,
            id: last.raw.topMessage,
            topic: last.raw.id,
        } :
        undefined

    return makeArrayPaginated(topics, res.count, next)
}
