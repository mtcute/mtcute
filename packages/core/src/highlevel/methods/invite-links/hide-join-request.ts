import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike } from '../../types/index.js'
import { resolvePeer, resolveUser } from '../users/resolve-peer.js'

/**
 * Approve or decline join request to a chat.
 */
export async function hideJoinRequest(
    client: ITelegramClient,
    params: {
        /** Chat/channel ID */
        chatId: InputPeerLike
        /** User ID */
        user: InputPeerLike
        /** Whether to approve or decline the join request */
        action: 'approve' | 'decline'
    },
): Promise<void> {
    const { chatId, user, action } = params

    const userId = await resolveUser(client, user)

    await client.call({
        _: 'messages.hideChatJoinRequest',
        approved: action === 'approve',
        peer: await resolvePeer(client, chatId),
        userId,
    })
}
