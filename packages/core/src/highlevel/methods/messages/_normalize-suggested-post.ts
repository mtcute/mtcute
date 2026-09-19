import type { tl } from '../../../tl/index.js'
import type { InputStarsAmount } from '../premium/_normalize-stars-amount.js'
import { normalizeDate } from '../../utils/misc-utils.js'
import { _normalizeStarsAmount } from '../premium/_normalize-stars-amount.js'

/**
 * Information about a post suggested to a channel via its direct messages chat
 *
 * @exported
 */
export interface InputSuggestedPost {
  /**
   * Price of the post that will be paid to the channel once the post is published.
   * Pass a `{ _: 'starsTonAmount', ... }` object to pay in TON.
   *
   * If not passed, the post is suggested for free
   */
  price?: InputStarsAmount

  /**
   * Date when the post should be published.
   * When passing a number, a UNIX time in ms is expected.
   *
   * If not passed, the date will be chosen by the channel administrators
   */
  scheduleDate?: Date | number
}

export function _normalizeInputSuggestedPost(post: InputSuggestedPost | undefined): tl.RawSuggestedPost | undefined {
  if (!post) return undefined

  return {
    _: 'suggestedPost',
    price: post.price !== undefined ? _normalizeStarsAmount(post.price) : undefined,
    scheduleDate: normalizeDate(post.scheduleDate),
  }
}
