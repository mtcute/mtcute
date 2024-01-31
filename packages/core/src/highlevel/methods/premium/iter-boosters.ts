import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike } from '../../types/index.js'
import { Boost } from '../../types/premium/boost.js'
import { resolvePeer } from '../users/resolve-peer.js'
import { getBoosts } from './get-boosts.js'

/**
 * Iterate over boosters of a channel.
 *
 * Wrapper over {@link getBoosters}
 *
 * @returns  IDs of stories that were removed
 */
export async function* iterBoosters(
    client: ITelegramClient,
    peerId: InputPeerLike,
    params?: Parameters<typeof getBoosts>[2] & {
        /**
         * Total number of boosters to fetch
         *
         * @default  Infinity, i.e. fetch all boosters
         */
        limit?: number

        /**
         * Number of boosters to fetch per request
         * Usually you don't need to change this
         *
         * @default  100
         */
        chunkSize?: number
    },
): AsyncIterableIterator<Boost> {
    if (!params) params = {}
    const { limit = Infinity, chunkSize = 100 } = params

    let { offset } = params
    let current = 0

    const peer = await resolvePeer(client, peerId)

    for (;;) {
        const res = await getBoosts(client, peer, {
            offset,
            limit: Math.min(limit - current, chunkSize),
        })

        for (const booster of res) {
            yield booster

            if (++current >= limit) return
        }

        if (!res.next) return
        offset = res.next
    }
}
