import type { tl } from '../../../tl/index.js'

import type { PeersIndex } from '../peers/index.js'
import { MtcuteError } from '../../../types/errors.js'
import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { User } from '../peers/index.js'

/**
 * Status of a user's subscription to the bot:
 *  - `canceled`: the subscription was canceled
 *  - `restored`: the subscription was restored
 *  - `payment_failed`: the payment for the subscription has failed
 */
export type BotSubscriptionStatus = 'canceled' | 'restored' | 'payment_failed'

/**
 * A user's Telegram Stars subscription to the bot has changed
 */
export class BotSubscriptionUpdate {
  constructor(
    readonly raw: tl.RawUpdateBotStarsSubscription,
    readonly _peers: PeersIndex,
  ) {}

  /** ID of the user whose subscription has changed */
  get userId(): number {
    return this.raw.userId
  }

  /** User whose subscription has changed */
  get user(): User {
    return new User(this._peers.user(this.raw.userId))
  }

  /**
   * Bot-defined payload of the subscription invoice
   * (see {@link InputMediaInvoice.payload})
   */
  get payload(): Uint8Array {
    return this.raw.payload
  }

  /** New status of the subscription */
  get status(): BotSubscriptionStatus {
    if (this.raw.canceled) return 'canceled'
    if (this.raw.restored) return 'restored'
    if (this.raw.paymentFailed) return 'payment_failed'

    throw new MtcuteError('updateBotStarsSubscription has none of canceled | restored | paymentFailed')
  }
}

memoizeGetters(BotSubscriptionUpdate, ['user'])
makeInspectable(BotSubscriptionUpdate)
