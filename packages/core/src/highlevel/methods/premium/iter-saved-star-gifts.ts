import type { ITelegramClient } from '../../client.types.js'
import type { getSavedStarGifts } from './get-saved-star-gifts.js'
import { PeersIndex } from '../../types/index.js'
import { SavedStarGift } from '../../types/premium/saved-star-gift.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Iterate over saved star gifts of a user,
 * wrapper over {@link getSavedStarGifts}
 */
export async function* iterSavedStarGifts(
    client: ITelegramClient,
    params: Parameters<typeof getSavedStarGifts>[1] & {
        /**
         * Number of gifts to fetch per request
         *
         * @default 100
         */
        chunkSize?: number

        /**
         * Total number of gifts to fetch
         *
         * @default Infinity
         */
        limit?: number
    },
): AsyncIterableIterator<SavedStarGift> {
    const {
        owner,
        offset: offsetInitial = '',
        chunkSize = 100,
        limit = Infinity,
        ...rest
    } = params

    const ownerPeer = await resolvePeer(client, owner)
    let offset = offsetInitial

    let current = 0

    while (true) {
        const res = await client.call({
            _: 'payments.getSavedStarGifts',
            peer: ownerPeer,
            offset,
            limit: Math.min(chunkSize, limit - current),
            ...rest,
        })

        const peers = PeersIndex.from(res)

        yield * res.gifts.map(it => new SavedStarGift(it, peers))

        if (!res.nextOffset) break
        offset = res.nextOffset
        current += res.gifts.length

        if (current >= limit) break
    }
}
