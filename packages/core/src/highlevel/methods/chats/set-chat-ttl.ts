import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Set maximum Time-To-Live of all newly sent messages in the specified chat
 *
 * @param chatId  Chat ID
 * @param period  New TTL period, in seconds (or 0 to disable)
 */
export async function setChatTtl(client: ITelegramClient, chatId: InputPeerLike, period: number): Promise<void> {
    await client.call({
        _: 'messages.setHistoryTTL',
        peer: await resolvePeer(client, chatId),
        period,
    })
}
