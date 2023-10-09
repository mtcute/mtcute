import { BaseTelegramClient } from '@mtcute/core'

import { InputPeerLike, Message } from '../../types'
import { normalizeToInputChannel } from '../../utils/peer-utils'
import { _findMessageInUpdate } from '../messages/find-in-update'
import { resolvePeer } from '../users/resolve-peer'

/**
 * Toggle open/close status of a topic in a forum
 *
 * Only admins with `manageTopics` permission can do this.
 *
 * @returns  Service message about the modification
 */
export async function toggleForumTopicClosed(
    client: BaseTelegramClient,
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

    const res = await client.call({
        _: 'channels.editForumTopic',
        channel: normalizeToInputChannel(await resolvePeer(client, chatId), chatId),
        topicId,
        closed,
    })

    return _findMessageInUpdate(client, res)
}
