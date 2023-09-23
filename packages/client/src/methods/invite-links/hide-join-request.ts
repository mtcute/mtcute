import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'
import { normalizeToInputUser } from '../../utils/peer-utils'

/**
 * Approve or deny join request to a chat.
 *
 * @param peer  Chat/channel ID
 * @param user  User ID
 * @param action  Whether to approve or deny the join request
 * @internal
 */
export async function hideJoinRequest(
    this: TelegramClient,
    peer: InputPeerLike,
    user: InputPeerLike,
    action: 'approve' | 'deny',
): Promise<void> {
    const userId = normalizeToInputUser(await this.resolvePeer(user), user)

    await this.call({
        _: 'messages.hideChatJoinRequest',
        approved: action === 'approve',
        peer: await this.resolvePeer(peer),
        userId,
    })
}
