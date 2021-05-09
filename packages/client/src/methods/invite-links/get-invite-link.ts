import { TelegramClient } from '../../client'
import { ChatInviteLink, InputPeerLike } from '../../types'
import { createUsersChatsIndex, normalizeToInputPeer } from '../../utils/peer-utils'

/**
 * Get detailed information about an invite link
 *
 * @param chatId  Chat ID
 * @param link  The invite link
 * @internal
 */
export async function getInviteLink(
    this: TelegramClient,
    chatId: InputPeerLike,
    link: string
): Promise<ChatInviteLink> {
    const res = await this.call({
        _: 'messages.getExportedChatInvite',
        peer: normalizeToInputPeer(await this.resolvePeer(chatId)),
        link
    })

    const { users } = createUsersChatsIndex(res)

    return new ChatInviteLink(this, res.invite, users)
}
