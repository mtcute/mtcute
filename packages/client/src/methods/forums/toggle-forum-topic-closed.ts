import { TelegramClient } from '../../client'
import { InputPeerLike, Message } from '../../types'
import { normalizeToInputChannel } from '../../utils/peer-utils'

/**
 * Toggle open/close status of a topic in a forum
 *
 * Only admins with `manageTopics` permission can do this.
 *
 * @returns  Service message about the modification
 * @internal
 */
export async function toggleForumTopicClosed(
    this: TelegramClient,
    parmas: {
        /** Chat ID or username */
        chatId: InputPeerLike

        /** ID of the topic (i.e. its top message ID) */
        topicId: number

        /** Whether the topic should be closed */
        closed: boolean
    },
): Promise<Message> {
    const { chatId, topicId, closed } = parmas

    const res = await this.call({
        _: 'channels.editForumTopic',
        channel: normalizeToInputChannel(await this.resolvePeer(chatId), chatId),
        topicId,
        closed,
    })

    return this._findMessageInUpdate(res)
}
