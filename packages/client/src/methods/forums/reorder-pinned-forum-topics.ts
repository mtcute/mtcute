import { BaseTelegramClient } from '@mtcute/core'

import { InputPeerLike } from '../../types'
import { normalizeToInputChannel } from '../../utils/peer-utils'
import { resolvePeer } from '../users/resolve-peer'

/**
 * Reorder pinned forum topics
 *
 * Only admins with `manageTopics` permission can do this.
 */
export async function reorderPinnedForumTopics(
    client: BaseTelegramClient,
    params: {
        /** Chat ID or username */
        chatId: InputPeerLike

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
    const { chatId, order, force } = params
    await client.call({
        _: 'channels.reorderPinnedForumTopics',
        channel: normalizeToInputChannel(await resolvePeer(client, chatId), chatId),
        order,
        force,
    })
}
