import type { ITelegramClient } from '../../client.types.js'
import type { InputStarGift } from '../../types/index.js'
import Long from 'long'
import { _normalizeInputStarGift } from './_normalize-input-star-gift.js'

/** Set resale price for an owned star gift */
export async function setResaleStarGiftPrice(
    client: ITelegramClient,
    params: {
        /** Star gift to update the price of */
        gift: InputStarGift

        /** New price of the gift (in stars), or `null` to unlist */
        price: number | null
    },
): Promise<void> {
    const { gift, price } = params

    const r = await client.call({
        _: 'payments.updateStarGiftPrice',
        stargift: await _normalizeInputStarGift(client, gift),
        resellStars: price === null ? Long.ZERO : Long.fromNumber(price),
    })

    client.handleClientUpdate(r)
}
