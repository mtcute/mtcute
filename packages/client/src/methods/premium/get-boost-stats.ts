import { BaseTelegramClient } from '@mtcute/core'

import { InputPeerLike } from '../../types/index.js'
import { BoostStats } from '../../types/premium/boost-stats.js'
import { resolvePeer } from '../users/resolve-peer.js'

// @available=user
/**
 * Get information about boosts in a channel
 *
 * @returns  IDs of stories that were removed
 */
export async function getBoostStats(client: BaseTelegramClient, peerId: InputPeerLike): Promise<BoostStats> {
    const res = await client.call({
        _: 'premium.getBoostsStatus',
        peer: await resolvePeer(client, peerId),
    })

    return new BoostStats(res)
}
