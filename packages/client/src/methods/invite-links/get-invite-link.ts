import { TelegramClient } from '../../client'
import { ChatInviteLink, InputPeerLike, PeersIndex } from '../../types'

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
    link: string,
): Promise<ChatInviteLink> {
    const res = await this.call({
        _: 'messages.getExportedChatInvite',
        peer: await this.resolvePeer(chatId),
        link,
    })

    const peers = PeersIndex.from(res)

    return new ChatInviteLink(this, res.invite, peers)
}
