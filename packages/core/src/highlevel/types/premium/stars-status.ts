import type { tl } from '@mtcute/tl'

import { makeInspectable } from '../../utils/inspectable.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { PeersIndex } from '../peers/peers-index.js'

import { StarsTransaction } from './stars-transaction.js'

export class StarsStatus {
  readonly peers: PeersIndex
  constructor(
    readonly raw: tl.payments.RawStarsStatus,
  ) {
    this.peers = PeersIndex.from(raw)
  }

  /** Current Telegram Stars balance */
  get balance(): tl.TypeStarsAmount {
    return this.raw.balance
  }

  /**
   * History of Telegram Stars transactions
   */
  get transactions(): StarsTransaction[] {
    return this.raw.history?.map(it => new StarsTransaction(it, this.peers)) ?? []
  }

  /** Next offset of {@link transactions} for pagination */
  get transactionsNextOffset(): string | null {
    return this.raw.nextOffset ?? null
  }
}

makeInspectable(StarsStatus)
memoizeGetters(StarsStatus, ['transactions'])
