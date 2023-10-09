import { BaseTelegramClient } from '@mtcute/core'

import { ChatInviteLink, InputPeerLike, PeersIndex } from '../../types'
import { resolvePeer } from '../users/resolve-peer'

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
    client: BaseTelegramClient,
    chatId: InputPeerLike,
    link: string,
): Promise<ChatInviteLink> {
    const res = await client.call({
        _: 'messages.editExportedChatInvite',
        peer: await resolvePeer(client, chatId),
        link,
        revoked: true,
    })

    const peers = PeersIndex.from(res)

    const invite = res._ === 'messages.exportedChatInviteReplaced' ? res.newInvite : res.invite

    return new ChatInviteLink(invite, peers)
}
