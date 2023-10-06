import { tl } from '@mtcute/core'
import { randomLong } from '@mtcute/core/utils'

import { TelegramClient } from '../../client'
import { InputPeerLike, Message } from '../../types'
import { normalizeToInputChannel } from '../../utils/peer-utils'

/**
 * Create a topic in a forum
 *
 * Only admins with `manageTopics` permission can do this.
 *
 * @returns  Service message for the created topic
 * @internal
 */
export async function createForumTopic(
    this: TelegramClient,
    params: {
        /** Chat ID or username */
        chatId: InputPeerLike

        /**
         * Topic title
         */
        title: string

        /**
         * Icon of the topic.
         *
         * Can be a number (color in RGB, see {@link ForumTopic} static members for allowed values)
         * or a custom emoji ID.
         *
         * Icon color can't be changed after the topic is created.
         */
        icon?: number | tl.Long

        /**
         * Send as a specific channel
         */
        sendAs?: InputPeerLike
    },
): Promise<Message> {
    const { chatId, title, icon, sendAs } = params

    const res = await this.call({
        _: 'channels.createForumTopic',
        channel: normalizeToInputChannel(await this.resolvePeer(chatId), chatId),
        title,
        iconColor: typeof icon === 'number' ? icon : undefined,
        iconEmojiId: typeof icon !== 'number' ? icon : undefined,
        sendAs: sendAs ? await this.resolvePeer(sendAs) : undefined,
        randomId: randomLong(),
    })

    return this._findMessageInUpdate(res)
}
