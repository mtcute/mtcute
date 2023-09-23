import { TelegramClient } from '../../client'
import { ChatInviteLink, InputPeerLike } from '../../types'

/**
 * Generate a new primary invite link for a chat,
 * old primary link is revoked.
 *
 * > **Note**: each administrator has their own primary invite link,
 * > and bots by default don't have one.
 *
 * @param chatId  Chat IDs
 * @internal
 */
export async function exportInviteLink(this: TelegramClient, chatId: InputPeerLike): Promise<ChatInviteLink> {
    const res = await this.call({
        _: 'messages.exportChatInvite',
        peer: await this.resolvePeer(chatId),
        legacyRevokePermanent: true,
    })

    return new ChatInviteLink(this, res)
}
