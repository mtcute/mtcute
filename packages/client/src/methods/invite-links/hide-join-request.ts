import { BaseTelegramClient } from '@mtcute/core'

import { InputPeerLike } from '../../types'
import { normalizeToInputUser } from '../../utils/peer-utils'
import { resolvePeer } from '../users/resolve-peer'

/**
 * Approve or deny join request to a chat.
 */
export async function hideJoinRequest(
    client: BaseTelegramClient,
    params: {
        /** Chat/channel ID */
        chatId: InputPeerLike
        /** User ID */
        user: InputPeerLike
        /** Whether to approve or deny the join request */
        action: 'approve' | 'deny'
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
