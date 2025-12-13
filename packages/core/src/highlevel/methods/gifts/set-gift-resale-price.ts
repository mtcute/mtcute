import type { tl } from '@mtcute/tl'
import type { ITelegramClient } from '../../client.types.js'
import type { InputStarGift } from '../../types/index.js'
import type { InputStarsAmount } from '../premium/_normalize-stars-amount.js'
import Long from 'long'
import { _normalizeStarsAmount } from '../premium/_normalize-stars-amount.js'
import { _normalizeInputStarGift } from './_normalize-input-star-gift.js'

/** Set resale price for an owned star gift */
export async function setResaleStarGiftPrice(
  client: ITelegramClient,
  params: {
    /** Star gift to update the price of */
    gift: InputStarGift

    /**
     * New price of the gift (in stars), or `null` to unlist
     */
    price: InputStarsAmount | null
  },
): Promise<void> {
  const { gift, price } = params

  let starsAmount: tl.TypeStarsAmount

  if (price === null) {
    starsAmount = { _: 'starsAmount', amount: Long.ZERO, nanos: 0 }
  } else {
    starsAmount = _normalizeStarsAmount(price)
  }

  const r = await client.call({
    _: 'payments.updateStarGiftPrice',
    stargift: await _normalizeInputStarGift(client, gift),
    resellAmount: starsAmount,
  })

  client.handleClientUpdate(r)
}
