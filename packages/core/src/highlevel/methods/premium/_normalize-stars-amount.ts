import type { tl } from '@mtcute/tl'
import Long from 'long'

/**
 * Defines a number of stars or a TON amount:
 *
 * - `number` and `Long` are considered as the exact number of stars.
 * - Fractional stars should be passed explicitly as `{ _: 'starsAmount', ... }` (though i'm not sure if any methods accept that)
 * - TON amounts and should be passed explicitly as `{ _: 'starsAmountTon', ... }`
 *
 * @exported
 */
export type InputStarsAmount = tl.Long | number | tl.TypeStarsAmount

export function _normalizeStarsAmount(amount: InputStarsAmount): tl.TypeStarsAmount {
  if (typeof amount === 'number') {
    return { _: 'starsAmount', amount: Long.fromNumber(amount), nanos: 0 }
  } else if (Long.isLong(amount)) {
    return { _: 'starsAmount', amount, nanos: 0 }
  } else {
    return amount
  }
}
