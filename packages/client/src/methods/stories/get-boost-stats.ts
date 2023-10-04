import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'
import { BoostStats } from '../../types/stories/boost-stats'

/**
 * Get information about boosts in a channel
 *
 * @returns  IDs of stories that were removed
 * @internal
 */
export async function getBoostStats(this: TelegramClient, peerId: InputPeerLike): Promise<BoostStats> {
    const res = await this.call({
        _: 'stories.getBoostsStatus',
        peer: await this.resolvePeer(peerId),
    })

    return new BoostStats(res)
}
