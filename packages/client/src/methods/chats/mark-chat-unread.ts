import { BaseTelegramClient } from '@mtcute/core'

import { InputPeerLike } from '../../types'
import { resolvePeer } from '../users/resolve-peer'

/**
 * Mark a chat as unread
 *
 * @param chatId  Chat ID
 */
export async function markChatUnread(client: BaseTelegramClient, chatId: InputPeerLike): Promise<void> {
    await client.call({
        _: 'messages.markDialogUnread',
        peer: {
            _: 'inputDialogPeer',
            peer: await resolvePeer(client, chatId),
        },
        unread: true,
    })
}
