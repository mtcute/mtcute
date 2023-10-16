import { BaseTelegramClient } from '@mtcute/core'

import { InputPeerLike } from '../../types/index.js'
import { normalizeToInputChannel } from '../../utils/peer-utils.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Set supergroup's slow mode interval.
 *
 * @param chatId  Chat ID or username
 * @param seconds
 *   Slow mode interval in seconds.
 *   Users will be able to send a message only once per this interval.
 *   Valid values are: `0 (off), 10, 30, 60 (1m), 300 (5m), 900 (15m) or 3600 (1h)`
 */
export async function setSlowMode(client: BaseTelegramClient, chatId: InputPeerLike, seconds = 0): Promise<void> {
    const res = await client.call({
        _: 'channels.toggleSlowMode',
        channel: normalizeToInputChannel(await resolvePeer(client, chatId), chatId),
        seconds,
    })
    client.network.handleUpdate(res)
}
