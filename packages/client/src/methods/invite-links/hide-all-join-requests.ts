import { TelegramClient } from '../../client'
import { InputPeerLike, MtInvalidPeerTypeError } from '../../types'
import { normalizeToInputUser } from '../../utils/peer-utils'

/**
 * Approve or deny multiple join requests to a chat.
 *
 * @param peer  Chat/channel ID
 * @param user  User ID
 * @param action  Whether to approve or deny the join requests
 * @param link  Invite link to target
 * @internal
 */
export async function hideAllJoinRequests(
    this: TelegramClient,
    peer: InputPeerLike,
    user: InputPeerLike,
    action: 'approve' | 'deny',
    link?: string,
): Promise<void> {
    const userId = normalizeToInputUser(await this.resolvePeer(user), user)

    await this.call({
        _: 'messages.hideAllChatJoinRequests',
        approved: action === 'approve',
        peer: await this.resolvePeer(peer),
        link,
    })
}
