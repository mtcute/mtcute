import { MtTypeAssertionError } from '../../../types/errors.js'
import { ITelegramClient } from '../../client.types.js'
import { ChatInviteLink, InputPeerLike, PeersIndex } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Get primary invite link of a chat
 *
 * @param chatId  Chat ID
 */
export async function getPrimaryInviteLink(client: ITelegramClient, chatId: InputPeerLike): Promise<ChatInviteLink> {
    const res = await client.call({
        _: 'messages.getExportedChatInvites',
        peer: await resolvePeer(client, chatId),
        adminId: { _: 'inputUserSelf' },
        limit: 1,
        revoked: false,
    })

    if (res.invites[0]?._ !== 'chatInviteExported') {
        throw new MtTypeAssertionError(
            'messages.getExportedChatInvites (@ .invites[0])',
            'chatInviteExported',
            res.invites[0]?._,
        )
    }

    if (!res.invites[0].permanent) {
        throw new MtTypeAssertionError('messages.getExportedChatInvites (@ .invites[0].permanent)', 'true', 'false')
    }

    const peers = PeersIndex.from(res)

    return new ChatInviteLink(res.invites[0], peers)
}
