import { BaseTelegramClient, Long, tl } from '@mtcute/core'

import type { ForumTopic, InputPeerLike, Message } from '../../types'
import { normalizeToInputChannel } from '../../utils/peer-utils'
import { _findMessageInUpdate } from '../messages/find-in-update'
import { resolvePeer } from '../users/resolve-peer'

/**
 * Modify a topic in a forum
 *
 * Only admins with `manageTopics` permission can do this.
 *
 * @param chatId  Chat ID or username
 * @param topicId  ID of the topic (i.e. its top message ID)
 * @returns  Service message about the modification
 */
export async function editForumTopic(
    client: BaseTelegramClient,
    params: {
        /** Chat ID or username */
        chatId: InputPeerLike

        /** ID of the topic (i.e. its top message ID) */
        topicId: number | ForumTopic

        /**
         * New topic title
         */
        title?: string

        /**
         * New icon of the topic.
         *
         * Can be a custom emoji ID, or `null` to remove the icon
         * and use static color instead
         */
        icon?: tl.Long | null
    },
): Promise<Message> {
    const { chatId, topicId, title, icon } = params

    const res = await client.call({
        _: 'channels.editForumTopic',
        channel: normalizeToInputChannel(await resolvePeer(client, chatId), chatId),
        topicId: typeof topicId === 'number' ? topicId : topicId.id,
        title,
        iconEmojiId: icon ? icon ?? Long.ZERO : undefined,
    })

    return _findMessageInUpdate(client, res)
}
