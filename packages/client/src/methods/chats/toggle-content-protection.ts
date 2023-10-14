import { BaseTelegramClient } from '@mtcute/core'

import { InputPeerLike } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Set whether a chat has content protection (i.e. forwarding messages is disabled)
 *
 * @param chatId  Chat ID or username
 * @param enabled  Whether content protection should be enabled
 */
export async function toggleContentProtection(
    client: BaseTelegramClient,
    chatId: InputPeerLike,
    enabled = false,
): Promise<void> {
    const res = await client.call({
        _: 'messages.toggleNoForwards',
        peer: await resolvePeer(client, chatId),
        enabled,
    })
    client.network.handleUpdate(res)
}
