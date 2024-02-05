import { ITelegramClient } from '../../client.types.js'
import type { ForumTopic, InputPeerLike } from '../../types/index.js'
import { resolveChannel } from '../users/resolve-peer.js'

/**
 * Reorder pinned forum topics
 *
 * Only admins with `manageTopics` permission can do this.
 */
export async function reorderPinnedForumTopics(
    client: ITelegramClient,
    params: {
        /** Chat ID or username */
        chatId: InputPeerLike

        /**
         * Order of the pinned topics
         */
        order: (number | ForumTopic)[]

        /**
         * Whether to un-pin topics not present in the order
         */
        force?: boolean
    },
): Promise<void> {
    const { chatId, order, force } = params
    await client.call({
        _: 'channels.reorderPinnedForumTopics',
        channel: await resolveChannel(client, chatId),
        order: order.map((it) => (typeof it === 'number' ? it : it.id)),
        force,
    })
}
