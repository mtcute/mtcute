import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/peers/peer.js'
import type { InputStarGift } from '../../types/premium/stars-gift.js'
import { type MaybeArray, parallelMap } from '@fuman/utils'
import { assertTrue } from '../../../utils/type-assertions.js'
import { resolvePeer } from '../users/resolve-peer.js'
import { _normalizeInputStarGift } from './_normalize-input-star-gift.js'

/**
 * Toggles whether one or more star gift is pinned to the top of the list
 */
export async function togglePinnedStarGifts(
    client: ITelegramClient,
    params: {
        /** One or more gifts to pin */
        gifts: MaybeArray<InputStarGift>
        /** Peer where the gift is sent */
        peer: InputPeerLike
    },
): Promise<void> {
    const gifts = await parallelMap(
        Array.isArray(params.gifts) ? params.gifts : [params.gifts],
        it => _normalizeInputStarGift(client, it),
    )

    const res = await client.call({
        _: 'payments.toggleStarGiftsPinnedToTop',
        stargift: gifts,
        peer: await resolvePeer(client, params.peer),
    })

    assertTrue('payments.toggleStarGiftsPinnedToTop', res)
}
