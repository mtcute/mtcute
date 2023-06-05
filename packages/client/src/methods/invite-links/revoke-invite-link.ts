import { TelegramClient } from '../../client'
import { ChatInviteLink, InputPeerLike, PeersIndex } from '../../types'

/**
 * Revoke an invite link.
 *
 * If `link` is a primary invite link, a new invite link will be
 * generated automatically by Telegram
 *
 * @param chatId  Chat ID
 * @param link  Invite link to revoke
 * @returns  If `link` is a primary invite, newly generated invite link, otherwise the revoked link
 * @internal
 */
export async function revokeInviteLink(
    this: TelegramClient,
    chatId: InputPeerLike,
    link: string,
): Promise<ChatInviteLink> {
    const res = await this.call({
        _: 'messages.editExportedChatInvite',
        peer: await this.resolvePeer(chatId),
        link,
        revoked: true,
    })

    const peers = PeersIndex.from(res)

    const invite =
        res._ === 'messages.exportedChatInviteReplaced' ?
            res.newInvite :
            res.invite

    return new ChatInviteLink(this, invite, peers)
}
