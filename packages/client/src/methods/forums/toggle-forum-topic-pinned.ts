import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'
import { normalizeToInputChannel } from '../../utils/peer-utils'

/**
 * Toggle whether a topic in a forum is pinned
 *
 * Only admins with `manageTopics` permission can do this.
 *
 * @internal
 */
export async function toggleForumTopicPinned(
    this: TelegramClient,
    params: {
        /** Chat ID or username */
        chatId: InputPeerLike
        /** ID of the topic (i.e. its top message ID) */
        topicId: number
        /** Whether the topic should be pinned */
        pinned: boolean
    },
): Promise<void> {
    const { chatId, topicId, pinned } = params

    await this.call({
        _: 'channels.updatePinnedForumTopic',
        channel: normalizeToInputChannel(await this.resolvePeer(chatId), chatId),
        topicId,
        pinned,
    })
}
