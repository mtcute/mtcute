import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike } from '../../types/index.js'
import { BoostStats } from '../../types/premium/boost-stats.js'
import { resolvePeer } from '../users/resolve-peer.js'

// @available=user
/**
 * Get information about boosts in a channel
 *
 * @returns  IDs of stories that were removed
 */
export async function getBoostStats(client: ITelegramClient, peerId: InputPeerLike): Promise<BoostStats> {
    const res = await client.call({
        _: 'premium.getBoostsStatus',
        peer: await resolvePeer(client, peerId),
    })

    return new BoostStats(res)
}
