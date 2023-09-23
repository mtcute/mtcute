import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'

/**
 * Approve or deny multiple join requests to a chat.
 *
 * @param peer  Chat/channel ID
 * @param action  Whether to approve or deny the join requests
 * @param link  Invite link to target
 * @internal
 */
export async function hideAllJoinRequests(
    this: TelegramClient,
    peer: InputPeerLike,
    action: 'approve' | 'deny',
    link?: string,
): Promise<void> {
    await this.call({
        _: 'messages.hideAllChatJoinRequests',
        approved: action === 'approve',
        peer: await this.resolvePeer(peer),
        link,
    })
}
