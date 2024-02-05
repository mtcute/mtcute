import { ITelegramClient } from '../../client.types.js'
import { ForumTopic, InputPeerLike } from '../../types/index.js'
import { resolveChannel } from '../users/resolve-peer.js'

/**
 * Toggle whether a topic in a forum is pinned
 *
 * Only admins with `manageTopics` permission can do this.
 */
export async function toggleForumTopicPinned(
    client: ITelegramClient,
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
        channel: await resolveChannel(client, chatId),
        topicId: typeof topicId === 'number' ? topicId : topicId.id,
        pinned,
    })
}
