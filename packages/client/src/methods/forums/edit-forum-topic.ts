import { Long, tl } from '@mtcute/core'

import { TelegramClient } from '../../client'
import { InputPeerLike, Message } from '../../types'
import { normalizeToInputChannel } from '../../utils/peer-utils'

/**
 * Modify a topic in a forum
 *
 * Only admins with `manageTopics` permission can do this.
 *
 * @param chatId  Chat ID or username
 * @param topicId  ID of the topic (i.e. its top message ID)
 * @returns  Service message about the modification
 * @internal
 */
export async function editForumTopic(
    this: TelegramClient,
    chatId: InputPeerLike,
    topicId: number,
    params: {
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
    const { title, icon } = params

    const res = await this.call({
        _: 'channels.editForumTopic',
        channel: normalizeToInputChannel(await this.resolvePeer(chatId), chatId),
        topicId,
        title,
        iconEmojiId: icon ? icon ?? Long.ZERO : undefined,
    })

    return this._findMessageInUpdate(res)
}
