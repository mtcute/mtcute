import { ITelegramClient } from '../../client.types.js'
import { ArrayPaginated, InputPeerLike, PeersIndex } from '../../types/index.js'
import { Boost } from '../../types/premium/boost.js'
import { makeArrayPaginated } from '../../utils/index.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Get boosts of a channel
 */
export async function getBoosts(
    client: ITelegramClient,
    peerId: InputPeerLike,
    params?: {
        /**
         * Offset for pagination
         */
        offset?: string

        /**
         * Maximum number of boosters to fetch
         *
         * @default  100
         */
        limit?: number
    },
): Promise<ArrayPaginated<Boost, string>> {
    const { offset = '', limit = 100 } = params ?? {}

    const res = await client.call({
        _: 'premium.getBoostsList',
        peer: await resolvePeer(client, peerId),
        offset,
        limit,
    })

    const peers = PeersIndex.from(res)

    return makeArrayPaginated(
        res.boosts.map((it) => new Boost(it, peers)),
        res.count,
        res.nextOffset,
    )
}
