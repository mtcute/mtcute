import type { ITelegramClient } from '../../client.types.js'
import type { ArrayPaginated, InputPeerLike } from '../../types/index.js'
import { PeersIndex } from '../../types/index.js'
import { SavedStarGift } from '../../types/premium/saved-star-gift.js'
import { makeArrayPaginated } from '../../utils/misc-utils.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Get a list of saved star gifts of a user/channel
 *
 * Note that filters currently only work for channels
 */
export async function getSavedStarGifts(
    client: ITelegramClient,
    params: {
        /** Peer to get saved gifts from */
        owner: InputPeerLike

        /** Whether to exclude hidden gifts */
        excludeHidden?: boolean
        /** Whether to exclude publicly visible gifts */
        excludePublic?: boolean
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
): Promise<ArrayPaginated<SavedStarGift, string>> {
    const res = await client.call({
        _: 'payments.getSavedStarGifts',
        peer: await resolvePeer(client, params.owner),
        excludeUnsaved: params.excludeHidden,
        excludeSaved: params.excludePublic,
        excludeUnlimited: params.excludeUnlimited,
        excludeLimited: params.excludeLimited,
        excludeUnique: params.excludeUnique,
        sortByValue: params.sortByValue,
        offset: params.offset ?? '',
        limit: params.limit ?? 100,
    })

    const peers = PeersIndex.from(res)

    return makeArrayPaginated(
        res.gifts.map(it => new SavedStarGift(it, peers)),
        res.count,
        res.nextOffset,
    )
}
