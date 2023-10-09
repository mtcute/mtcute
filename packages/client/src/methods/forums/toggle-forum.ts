import { BaseTelegramClient } from '@mtcute/core'

import { InputPeerLike } from '../../types'
import { normalizeToInputChannel } from '../../utils/peer-utils'
import { resolvePeer } from '../users/resolve-peer'

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
        channel: normalizeToInputChannel(await resolvePeer(client, chatId), chatId),
        enabled,
    })
    client.network.handleUpdate(res)
}
