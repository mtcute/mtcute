import { BaseTelegramClient } from '@mtcute/core'

import { InputPeerLike } from '../../types'
import { BoostStats } from '../../types/stories/boost-stats'
import { resolvePeer } from '../users/resolve-peer'

/**
 * Get information about boosts in a channel
 *
 * @returns  IDs of stories that were removed
 */
export async function getBoostStats(client: BaseTelegramClient, peerId: InputPeerLike): Promise<BoostStats> {
    const res = await client.call({
        _: 'stories.getBoostsStatus',
        peer: await resolvePeer(client, peerId),
    })

    return new BoostStats(res)
}
