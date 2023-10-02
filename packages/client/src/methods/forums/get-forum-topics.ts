import { TelegramClient } from '../../client'
import { ArrayPaginated, ForumTopic, InputPeerLike } from '../../types'
import { makeArrayPaginated } from '../../utils'
import { normalizeToInputChannel } from '../../utils/peer-utils'

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
 * @internal
 */
export async function getForumTopics(
    this: TelegramClient,
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

    const res = await this.call({
        _: 'channels.getForumTopics',
        channel: normalizeToInputChannel(await this.resolvePeer(chatId), chatId),
        q: query,
        offsetDate,
        offsetId,
        offsetTopic,
        limit,
    })

    const topics = ForumTopic.parseTlForumTopics(this, res)

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
