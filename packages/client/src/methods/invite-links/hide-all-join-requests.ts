import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'

/**
 * Approve or deny multiple join requests to a chat.
 *
 * @internal
 */
export async function hideAllJoinRequests(
    this: TelegramClient,
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

    await this.call({
        _: 'messages.hideAllChatJoinRequests',
        approved: action === 'approve',
        peer: await this.resolvePeer(chatId),
        link,
    })
}
