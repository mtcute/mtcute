import { BaseTelegramClient, MaybeArray } from '@mtcute/core'

import { ForumTopic, InputPeerLike } from '../../types'
import { normalizeToInputChannel } from '../../utils'
import { resolvePeer } from '../users/resolve-peer'

/**
 * Get a single forum topic by its ID
 *
 * @param chatId  Chat ID or username
 */
export async function getForumTopicsById(
    client: BaseTelegramClient,
    chatId: InputPeerLike,
    ids: number,
): Promise<ForumTopic>

/**
 * Get forum topics by their IDs
 *
 * @param chatId  Chat ID or username
 */
export async function getForumTopicsById(
    client: BaseTelegramClient,
    chatId: InputPeerLike,
    ids: number[],
): Promise<ForumTopic[]>

/**
 * Get forum topics by their IDs
 *
 * @param chatId  Chat ID or username
 */
export async function getForumTopicsById(
    client: BaseTelegramClient,
    chatId: InputPeerLike,
    ids: MaybeArray<number>,
): Promise<MaybeArray<ForumTopic>> {
    const single = !Array.isArray(ids)
    if (single) ids = [ids as number]

    const res = await client.call({
        _: 'channels.getForumTopicsByID',
        channel: normalizeToInputChannel(await resolvePeer(client, chatId)),
        topics: ids as number[],
    })

    const topics = ForumTopic.parseTlForumTopics(res)

    return single ? topics[0] : topics
}
