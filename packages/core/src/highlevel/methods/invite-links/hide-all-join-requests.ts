import { ITelegramClient } from '../../client.types.js'
import type { ChatInviteLink, InputPeerLike } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Approve or decline multiple join requests to a chat.
 */
export async function hideAllJoinRequests(
    client: ITelegramClient,
    params: {
        /** Chat/channel ID */
        chatId: InputPeerLike

        /** Whether to approve or decline the join requests */
        action: 'approve' | 'decline'

        /** Invite link to target */
        link?: string | ChatInviteLink
    },
): Promise<void> {
    const { chatId, action, link } = params

    await client.call({
        _: 'messages.hideAllChatJoinRequests',
        approved: action === 'approve',
        peer: await resolvePeer(client, chatId),
        link: typeof link === 'string' ? link : link?.link,
    })
}
