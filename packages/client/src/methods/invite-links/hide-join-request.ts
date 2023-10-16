import { BaseTelegramClient } from '@mtcute/core'

import { InputPeerLike } from '../../types/index.js'
import { normalizeToInputUser } from '../../utils/peer-utils.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Approve or decline join request to a chat.
 */
export async function hideJoinRequest(
    client: BaseTelegramClient,
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

    const userId = normalizeToInputUser(await resolvePeer(client, user), user)

    await client.call({
        _: 'messages.hideChatJoinRequest',
        approved: action === 'approve',
        peer: await resolvePeer(client, chatId),
        userId,
    })
}
