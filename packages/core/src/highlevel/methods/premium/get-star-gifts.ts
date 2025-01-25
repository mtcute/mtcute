import type { ITelegramClient } from '../../client.types.js'
import type { SavedStarGift } from '../../types/index.js'
import type { InputPeerLike } from '../../types/peers/peer.js'
import type { ArrayPaginated } from '../../types/utils.js'
import { getSavedStarGifts } from './get-saved-star-gifts.js'

/**
 * Get a list of gifts sent to a user.
 *
 * @param userId  User whose gifts to fetch
 * @deprecated  Use {@link getSavedStarGifts} instead
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
): Promise<ArrayPaginated<SavedStarGift, string>> {
    return getSavedStarGifts(client, {
        owner: userId,
        ...params,
    })
}
