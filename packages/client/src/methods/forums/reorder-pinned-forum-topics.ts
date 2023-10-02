import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'
import { normalizeToInputChannel } from '../../utils/peer-utils'

/**
 * Reorder pinned forum topics
 *
 * Only admins with `manageTopics` permission can do this.
 *
 * @param chatId  Chat ID or username
 * @param topicId  ID of the topic (i.e. its top message ID)
 * @internal
 */
export async function reorderPinnedForumTopics(
    this: TelegramClient,
    chatId: InputPeerLike,
    params: {
        /**
         * Order of the pinned topics
         */
        order: number[]

        /**
         * Whether to un-pin topics not present in the order
         */
        force?: boolean
    },
): Promise<void> {
    const { order, force } = params
    await this.call({
        _: 'channels.reorderPinnedForumTopics',
        channel: normalizeToInputChannel(await this.resolvePeer(chatId), chatId),
        order,
        force,
    })
}
