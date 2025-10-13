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
        /** Whether to exclude unique gifts */
        excludeUnique?: boolean
        /** Whether to exclude gifts that cannot be upgraded (either not limited or already upgraded) */
        excludeUnupgradable?: boolean
        /** Whether to exclude gifts that can be upgraded */
        excludeUpgradable?: boolean
        /** Whether to exclude "hosted" gifts (i.e. those that are actually stored on the TON blockchain) */
        excludeHosted?: boolean

        /** Whether to only return gifts with peer color available */
        peerColorAvailable?: boolean

        /** ID of the collection to get gifts from */
        collectionId?: number

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
        excludeUnupgradable: params.excludeUnupgradable,
        excludeUpgradable: params.excludeUpgradable,
        excludeUnique: params.excludeUnique,
        peerColorAvailable: params.peerColorAvailable,
        sortByValue: params.sortByValue,
        collectionId: params.collectionId,
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
