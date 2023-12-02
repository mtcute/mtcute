import { BaseTelegramClient } from '@mtcute/core'

import { InputPeerLike } from '../../types/index.js'
import { toInputChannel } from '../../utils/peer-utils.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Set whether a supergroup is a forum.
 *
 * Only owner of the supergroup can change this setting.
 *
 * @param chatId  Chat ID or username
 * @param enabled  Whether the supergroup should be a forum
 */
export async function toggleForum(client: BaseTelegramClient, chatId: InputPeerLike, enabled = false): Promise<void> {
    const res = await client.call({
        _: 'channels.toggleForum',
        channel: toInputChannel(await resolvePeer(client, chatId), chatId),
        enabled,
    })
    client.network.handleUpdate(res)
}
