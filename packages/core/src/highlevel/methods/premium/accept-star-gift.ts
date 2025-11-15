import type { ITelegramClient } from '../../client.types.js'
import type { InputStarGift } from '../../types/index.js'
import { _normalizeInputStarGift } from './_normalize-input-star-gift.js'

// @available=user
/**
 * Accept, hide or convert a star gift.
 *
 * @returns  Whether the action was successful
 */
export async function acceptStarGift(
  client: ITelegramClient,
  params: {
    /** Input star gift to accept */
    gift: InputStarGift

    /**
     * Action to perform on the gift.
     *  - `save` - save the gift to your profile
     *  - `hide` - hide the gift from your profile
     *  - `convert` - convert the gift to stars (can't be undone)
     */
    action: 'save' | 'hide' | 'convert'
  },
): Promise<boolean> {
  const { action } = params
  const inputStarGift = await _normalizeInputStarGift(client, params.gift)
  return client.call(
    action === 'convert'
      ? {
          _: 'payments.convertStarGift',
          stargift: inputStarGift,
        }
      : {
          _: 'payments.saveStarGift',
          unsave: action === 'hide',
          stargift: inputStarGift,
        },
  )
}
