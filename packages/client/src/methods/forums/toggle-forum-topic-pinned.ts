import { BaseTelegramClient } from '@mtcute/core'

import { ForumTopic, InputPeerLike } from '../../types'
import { normalizeToInputChannel } from '../../utils/peer-utils'
import { resolvePeer } from '../users/resolve-peer'

/**
 * Toggle whether a topic in a forum is pinned
 *
 * Only admins with `manageTopics` permission can do this.
 */
export async function toggleForumTopicPinned(
    client: BaseTelegramClient,
    params: {
        /** Chat ID or username */
        chatId: InputPeerLike
        /** ID of the topic (i.e. its top message ID) */
        topicId: number | ForumTopic
        /** Whether the topic should be pinned */
        pinned: boolean
    },
): Promise<void> {
    const { chatId, topicId, pinned } = params

    await client.call({
        _: 'channels.updatePinnedForumTopic',
        channel: normalizeToInputChannel(await resolvePeer(client, chatId), chatId),
        topicId: typeof topicId === 'number' ? topicId : topicId.id,
        pinned,
    })
}
