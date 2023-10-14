import { BaseTelegramClient } from '@mtcute/core'

import { ChatInviteLink, InputPeerLike } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Generate a new primary invite link for a chat,
 * old primary link is revoked.
 *
 * > **Note**: each administrator has their own primary invite link,
 * > and bots by default don't have one.
 *
 * @param chatId  Chat IDs
 */
export async function exportInviteLink(client: BaseTelegramClient, chatId: InputPeerLike): Promise<ChatInviteLink> {
    const res = await client.call({
        _: 'messages.exportChatInvite',
        peer: await resolvePeer(client, chatId),
        legacyRevokePermanent: true,
    })

    return new ChatInviteLink(res)
}
