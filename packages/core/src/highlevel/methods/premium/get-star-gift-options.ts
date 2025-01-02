import type { ITelegramClient } from '../../client.types.js'
import { assertTypeIsNot } from '../../../utils/type-assertions.js'
import { StarGift } from '../../types/premium/stars-gift.js'

// @available=user
/**
 * Get the list of available star gifts.
 */
export async function getStarGiftOptions(client: ITelegramClient): Promise<StarGift[]> {
    const res = await client.call({
        _: 'payments.getStarGifts',
        hash: 0,
    })

    assertTypeIsNot('payments.getStarGifts', res, 'payments.starGiftsNotModified')

    const ret: StarGift[] = []
    for (const gift of res.gifts) {
        if (gift._ === 'starGift') {
            ret.push(new StarGift(gift))
        }
    }

    return ret
}
