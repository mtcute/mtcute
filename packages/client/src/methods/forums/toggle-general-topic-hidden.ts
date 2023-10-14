import { BaseTelegramClient } from '@mtcute/core'

import { InputPeerLike, Message } from '../../types/index.js'
import { normalizeToInputChannel } from '../../utils/peer-utils.js'
import { _findMessageInUpdate } from '../messages/find-in-update.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Toggle whether "General" topic in a forum is hidden or not
 *
 * Only admins with `manageTopics` permission can do this.
 *
 * @returns  Service message about the modification
 */
export async function toggleGeneralTopicHidden(
    client: BaseTelegramClient,
    params: {
        /** Chat ID or username */
        chatId: InputPeerLike
        /** Whether the topic should be hidden */
        hidden: boolean

        /**
         * Whether to dispatch the returned service message (if any)
         * to the client's update handler.
         */
        shouldDispatch?: true
    },
): Promise<Message> {
    const { chatId, hidden, shouldDispatch } = params
    const res = await client.call({
        _: 'channels.editForumTopic',
        channel: normalizeToInputChannel(await resolvePeer(client, chatId), chatId),
        topicId: 1,
        hidden,
    })

    return _findMessageInUpdate(client, res, false, shouldDispatch)
}
