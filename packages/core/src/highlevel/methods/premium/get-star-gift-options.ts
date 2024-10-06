import { assertTypeIsNot } from '../../../utils/type-assertions.js'
import type { ITelegramClient } from '../../client.types.js'
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

    return res.gifts.map(gift => new StarGift(gift))
}
