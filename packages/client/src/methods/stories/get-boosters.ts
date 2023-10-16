import { BaseTelegramClient } from '@mtcute/core'

import { ArrayPaginated, InputPeerLike, PeersIndex } from '../../types/index.js'
import { Booster } from '../../types/stories/booster.js'
import { makeArrayPaginated } from '../../utils/index.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Get boosters of a channel
 *
 * @returns  IDs of stories that were removed
 */
export async function getBoosters(
    client: BaseTelegramClient,
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
): Promise<ArrayPaginated<Booster, string>> {
    const { offset = '', limit = 100 } = params ?? {}

    const res = await client.call({
        _: 'stories.getBoostersList',
        peer: await resolvePeer(client, peerId),
        offset,
        limit,
    })

    const peers = PeersIndex.from(res)

    return makeArrayPaginated(
        res.boosters.map((it) => new Booster(it, peers)),
        res.count,
        res.nextOffset,
    )
}
