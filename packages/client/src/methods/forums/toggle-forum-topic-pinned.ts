import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'
import { normalizeToInputChannel } from '../../utils/peer-utils'

/**
 * Toggle whether a topic in a forum is pinned
 *
 * Only admins with `manageTopics` permission can do this.
 *
 * @param chatId  Chat ID or username
 * @param topicId  ID of the topic (i.e. its top message ID)
 * @param pinned  Whether the topic should be pinned
 * @internal
 */
export async function toggleForumTopicPinned(
    this: TelegramClient,
    chatId: InputPeerLike,
    topicId: number,
    pinned: boolean,
): Promise<void> {
    await this.call({
        _: 'channels.updatePinnedForumTopic',
        channel: normalizeToInputChannel(await this.resolvePeer(chatId), chatId),
        topicId,
        pinned,
    })
}
