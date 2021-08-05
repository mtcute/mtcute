import { TelegramClient } from '../../client'
import {
    ChatInviteLink,
    InputPeerLike,
    MtTypeAssertionError,
} from '../../types'
import { createUsersChatsIndex } from '../../utils/peer-utils'

/**
 * Get primary invite link of a chat
 *
 * @param chatId  Chat ID
 * @internal
 */
export async function getPrimaryInviteLink(
    this: TelegramClient,
    chatId: InputPeerLike
): Promise<ChatInviteLink> {
    const res = await this.call({
        _: 'messages.getExportedChatInvites',
        peer: await this.resolvePeer(chatId),
        adminId: { _: 'inputUserSelf' },
        limit: 1,
        revoked: false,
    })

    if (!res.invites[0]?.permanent)
        throw new MtTypeAssertionError(
            'messages.getExportedChatInvites (@ .invites[0].permanent)',
            'true',
            'false'
        )

    const { users } = createUsersChatsIndex(res)

    return new ChatInviteLink(this, res.invites[0], users)
}
