import Long from 'long'

import { ITelegramClient } from '../../client.types.js'
import { StickerSet } from '../../types/misc/sticker-set.js'
import { ArrayPaginated } from '../../types/utils.js'
import { makeArrayPaginated } from '../../utils/misc-utils.js'

// @available=user
/**
 * Get the list of sticker sets that were created by the current user
 */
export async function getMyStickerSets(
    client: ITelegramClient,
    params?: {
        /** Offset for pagination */
        offset?: Long
        /** Limit for pagination */
        limit?: number
    },
): Promise<ArrayPaginated<StickerSet, Long>> {
    const res = await client.call({
        _: 'messages.getMyStickers',
        offsetId: params?.offset ?? Long.ZERO,
        limit: params?.limit ?? 100,
    })

    const items = res.sets.map((x) => new StickerSet(x))

    return makeArrayPaginated(items, res.count, items[items.length - 1]?.brief.id)
}
