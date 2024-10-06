import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/peers/peer.js'
import { PeersIndex } from '../../types/peers/peers-index.js'
import { UserStarGift } from '../../types/premium/stars-gift.js'
import type { ArrayPaginated } from '../../types/utils.js'
import { makeArrayPaginated } from '../../utils/misc-utils.js'
import { resolveUser } from '../users/resolve-peer.js'

// @available=user
/**
 * Get a list of gifts sent to a user.
 *
 * @param userId  User whose gifts to fetch
 * @returns  Gifts sent to the user
 */
export async function getStarGifts(
    client: ITelegramClient,
    userId: InputPeerLike,
    params?: {
        /**
         * Offset for pagination.
         */
        offset?: string

        /**
         * Maximum number of gifts to fetch.
         *
         * @default  100
         */
        limit?: number
    },
): Promise<ArrayPaginated<UserStarGift, string>> {
    const { offset = '', limit = 100 } = params ?? {}

    const res = await client.call({
        _: 'payments.getUserStarGifts',
        userId: await resolveUser(client, userId),
        offset,
        limit,
    })

    const peers = PeersIndex.from(res)
    const gifts = res.gifts.map(gift => new UserStarGift(gift, peers))

    return makeArrayPaginated(gifts, res.count, offset)
}
