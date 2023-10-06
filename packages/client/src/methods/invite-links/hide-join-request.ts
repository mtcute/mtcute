import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'
import { normalizeToInputUser } from '../../utils/peer-utils'

/**
 * Approve or deny join request to a chat.
 *
 * @internal
 */
export async function hideJoinRequest(
    this: TelegramClient,
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

    const userId = normalizeToInputUser(await this.resolvePeer(user), user)

    await this.call({
        _: 'messages.hideChatJoinRequest',
        approved: action === 'approve',
        peer: await this.resolvePeer(chatId),
        userId,
    })
}
