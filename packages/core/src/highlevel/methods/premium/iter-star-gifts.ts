import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike, UserStarGift } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'

import { getStarGifts } from './get-star-gifts.js'

// @available=user
/**
 * Iterate over gifts sent to a given user.
 *
 * Wrapper over {@link getStarGifts}
 *
 * @param peerId  Peer ID
 * @param params  Additional parameters
 */
export async function* iterStarGifts(
    client: ITelegramClient,
    peerId: InputPeerLike,
    params?: Parameters<typeof getStarGifts>[2] & {
        /**
         * Total number of gifts to fetch
         *
         * @default  Infinity, i.e. fetch all gifts
         */
        limit?: number

        /**
         * Number of gifts to fetch per request
         * Usually you don't need to change this
         *
         * @default  100
         */
        chunkSize?: number
    },
): AsyncIterableIterator<UserStarGift> {
    if (!params) params = {}
    const { limit = Infinity, chunkSize = 100 } = params

    let { offset } = params
    let current = 0

    const peer = await resolvePeer(client, peerId)

    for (;;) {
        const res = await getStarGifts(client, peer, {
            offset,
            limit: Math.min(limit - current, chunkSize),
        })

        for (const gift of res) {
            yield gift

            if (++current >= limit) return
        }

        if (!res.next) return
        offset = res.next
    }
}
