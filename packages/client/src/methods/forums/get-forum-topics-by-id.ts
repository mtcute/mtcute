import { MaybeArray } from '@mtcute/core'

import { TelegramClient } from '../../client'
import { ForumTopic, InputPeerLike } from '../../types'
import { normalizeToInputChannel } from '../../utils'

/**
 * Get a single forum topic by its ID
 *
 * @param chatId  Chat ID or username
 * @internal
 */
export async function getForumTopicsById(this: TelegramClient, chatId: InputPeerLike, ids: number): Promise<ForumTopic>

/**
 * Get forum topics by their IDs
 *
 * @param chatId  Chat ID or username
 * @internal
 */
export async function getForumTopicsById(
    this: TelegramClient,
    chatId: InputPeerLike,
    ids: number[],
): Promise<ForumTopic[]>

/**
 * Get forum topics by their IDs
 *
 * @param chatId  Chat ID or username
 * @internal
 */
export async function getForumTopicsById(
    this: TelegramClient,
    chatId: InputPeerLike,
    ids: MaybeArray<number>,
): Promise<MaybeArray<ForumTopic>> {
    const single = !Array.isArray(ids)
    if (single) ids = [ids as number]

    const res = await this.call({
        _: 'channels.getForumTopicsByID',
        channel: normalizeToInputChannel(await this.resolvePeer(chatId)),
        topics: ids as number[],
    })

    const topics = ForumTopic.parseTlForumTopics(this, res)

    return single ? topics[0] : topics
}
