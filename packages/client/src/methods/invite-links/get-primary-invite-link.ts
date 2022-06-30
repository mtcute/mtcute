import { TelegramClient } from '../../client'
import {
    ChatInviteLink,
    InputPeerLike,
    MtTypeAssertionError,
    PeersIndex,
} from '../../types'

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

    if (res.invites[0]?._ !== 'chatInviteExported')
        throw new MtTypeAssertionError(
            'messages.getExportedChatInvites (@ .invites[0])',
            'chatInviteExported',
            res.invites[0]?._
        )

    if (!res.invites[0].permanent)
        throw new MtTypeAssertionError(
            'messages.getExportedChatInvites (@ .invites[0].permanent)',
            'true',
            'false'
        )

    const peers = PeersIndex.from(res)

    return new ChatInviteLink(this, res.invites[0], peers)
}
