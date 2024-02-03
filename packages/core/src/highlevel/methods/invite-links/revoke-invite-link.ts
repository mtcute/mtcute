import { ITelegramClient } from '../../client.types.js'
import { ChatInviteLink, InputPeerLike, PeersIndex } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Revoke an invite link.
 *
 * If `link` is a primary invite link, a new invite link will be
 * generated automatically by Telegram
 *
 * @param chatId  Chat ID
 * @param link  Invite link to revoke
 * @returns  If `link` is a primary invite, newly generated invite link, otherwise the revoked link
 */
export async function revokeInviteLink(
    client: ITelegramClient,
    chatId: InputPeerLike,
    link: string | ChatInviteLink,
): Promise<ChatInviteLink> {
    const res = await client.call({
        _: 'messages.editExportedChatInvite',
        peer: await resolvePeer(client, chatId),
        link: typeof link === 'string' ? link : link.link,
        revoked: true,
    })

    const peers = PeersIndex.from(res)

    const invite = res._ === 'messages.exportedChatInviteReplaced' ? res.newInvite : res.invite

    return new ChatInviteLink(invite, peers)
}
