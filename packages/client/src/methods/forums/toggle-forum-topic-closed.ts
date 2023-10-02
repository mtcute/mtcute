import { TelegramClient } from '../../client'
import { InputPeerLike, Message } from '../../types'
import { normalizeToInputChannel } from '../../utils/peer-utils'

/**
 * Toggle open/close status of a topic in a forum
 *
 * Only admins with `manageTopics` permission can do this.
 *
 * @param chatId  Chat ID or username
 * @param topicId  ID of the topic (i.e. its top message ID)
 * @param closed  Whether the topic should be closed
 * @returns  Service message about the modification
 * @internal
 */
export async function toggleForumTopicClosed(
    this: TelegramClient,
    chatId: InputPeerLike,
    topicId: number,
    closed: boolean,
): Promise<Message> {
    const res = await this.call({
        _: 'channels.editForumTopic',
        channel: normalizeToInputChannel(await this.resolvePeer(chatId), chatId),
        topicId,
        closed,
    })

    return this._findMessageInUpdate(res)
}
