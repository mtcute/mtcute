import { BaseTelegramClient } from '@mtcute/core'

import { InputPeerLike } from '../../types'
import { resolvePeer } from '../users/resolve-peer'

/**
 * Approve or deny multiple join requests to a chat.
 */
export async function hideAllJoinRequests(
    client: BaseTelegramClient,
    params: {
        /** Chat/channel ID */
        chatId: InputPeerLike

        /** Whether to approve or deny the join requests */
        action: 'approve' | 'deny'

        /** Invite link to target */
        link?: string
    },
): Promise<void> {
    const { chatId, action, link } = params

    await client.call({
        _: 'messages.hideAllChatJoinRequests',
        approved: action === 'approve',
        peer: await resolvePeer(client, chatId),
        link,
    })
}
