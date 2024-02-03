import { ITelegramClient } from '../../client.types.js'
import { ChatInviteLink, InputPeerLike, PeersIndex } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Get detailed information about an invite link
 *
 * @param chatId  Chat ID
 * @param link  The invite link
 */
export async function getInviteLink(
    client: ITelegramClient,
    chatId: InputPeerLike,
    link: string,
): Promise<ChatInviteLink> {
    const res = await client.call({
        _: 'messages.getExportedChatInvite',
        peer: await resolvePeer(client, chatId),
        link,
    })

    const peers = PeersIndex.from(res)

    return new ChatInviteLink(res.invite, peers)
}
