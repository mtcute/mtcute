import { BaseTelegramClient } from '@mtcute/core'

import { InputPeerLike } from '../../types'
import { resolvePeer } from '../users/resolve-peer'

/**
 * Unpin a message in a group, supergroup, channel or PM.
 *
 * For supergroups/channels, you must have appropriate permissions,
 * either as an admin, or as default permissions
 *
 * @param chatId  Chat ID, username, phone number, `"self"` or `"me"`
 * @param messageId  Message ID
 */
export async function unpinMessage(
    client: BaseTelegramClient,
    chatId: InputPeerLike,
    messageId: number,
): Promise<void> {
    const res = await client.call({
        _: 'messages.updatePinnedMessage',
        peer: await resolvePeer(client, chatId),
        id: messageId,
        unpin: true,
    })

    client.network.handleUpdate(res)
}
