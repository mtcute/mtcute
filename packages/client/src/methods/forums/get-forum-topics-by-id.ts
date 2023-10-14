import { BaseTelegramClient, MaybeArray } from '@mtcute/core'

import { ForumTopic, InputPeerLike } from '../../types/index.js'
import { normalizeToInputChannel } from '../../utils/index.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Get forum topics by their IDs
 *
 * @param chatId  Chat ID or username
 */
export async function getForumTopicsById(
    client: BaseTelegramClient,
    chatId: InputPeerLike,
    ids: MaybeArray<number>,
): Promise<ForumTopic[]> {
    if (!Array.isArray(ids)) ids = [ids]

    const res = await client.call({
        _: 'channels.getForumTopicsByID',
        channel: normalizeToInputChannel(await resolvePeer(client, chatId)),
        topics: ids,
    })

    return ForumTopic.parseTlForumTopics(res)
}
