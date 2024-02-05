import { ITelegramClient } from '../../client.types.js'
import type { ForumTopic, InputPeerLike, Message } from '../../types/index.js'
import { _findMessageInUpdate } from '../messages/find-in-update.js'
import { resolveChannel } from '../users/resolve-peer.js'

/**
 * Toggle open/close status of a topic in a forum
 *
 * Only admins with `manageTopics` permission can do this.
 *
 * @returns  Service message about the modification
 */
export async function toggleForumTopicClosed(
    client: ITelegramClient,
    parmas: {
        /** Chat ID or username */
        chatId: InputPeerLike

        /** ID of the topic (i.e. its top message ID) */
        topicId: number | ForumTopic

        /** Whether the topic should be closed */
        closed: boolean

        /**
         * Whether to dispatch the returned service message (if any)
         * to the client's update handler.
         */
        shouldDispatch?: true
    },
): Promise<Message> {
    const { chatId, topicId, closed, shouldDispatch } = parmas

    const res = await client.call({
        _: 'channels.editForumTopic',
        channel: await resolveChannel(client, chatId),
        topicId: typeof topicId === 'number' ? topicId : topicId.id,
        closed,
    })

    return _findMessageInUpdate(client, res, false, shouldDispatch)
}
