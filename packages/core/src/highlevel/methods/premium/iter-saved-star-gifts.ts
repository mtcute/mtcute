import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/index.js'
import { PeersIndex } from '../../types/index.js'
import { SavedStarGift } from '../../types/premium/saved-star-gift.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Iterate over saved star gifts of a user,
 * wrapper over {@link getSavedStarGifts}
 */
export async function* iterSavedStarGifts(
    client: ITelegramClient,
    params: {
        /** Peer to get saved gifts from */
        owner: InputPeerLike

        /** Whether to exclude unsaved gifts */
        excludeUnsaved?: boolean
        /** Whether to exclude saved gifts */
        excludeSaved?: boolean
        /** Whether to exclude gifts with unlimited availability */
        excludeUnlimited?: boolean
        /** Whether to exclude gifts with limited availability */
        excludeLimited?: boolean
        /** Whether to exclude unique gifts */
        excludeUnique?: boolean

        /** Whether to sort by value */
        sortByValue?: boolean

        /** Offset for pagination */
        offset?: string
        /** Limit for pagination */
        limit?: number
    },
): AsyncIterableIterator<SavedStarGift> {
    const owner = await resolvePeer(client, params.owner)
    let offset = ''

    while (true) {
        const res = await client.call({
            _: 'payments.getSavedStarGifts',
            peer: owner,
            excludeUnsaved: params.excludeUnsaved,
            excludeSaved: params.excludeSaved,
            excludeUnlimited: params.excludeUnlimited,
            excludeLimited: params.excludeLimited,
            excludeUnique: params.excludeUnique,
            sortByValue: params.sortByValue,
            offset,
            limit: params.limit ?? 100,
        })

        const peers = PeersIndex.from(res)

        yield * res.gifts.map(it => new SavedStarGift(it, peers))

        if (!res.nextOffset) break
        offset = res.nextOffset
    }
}
