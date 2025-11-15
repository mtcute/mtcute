import type { tl } from '@mtcute/tl'

import type { Sticker } from '../media/sticker.js'
import type { Message } from '../messages/message.js'
import type { InputPeerLike, Peer } from '../peers/peer.js'
import type { PeersIndex } from '../peers/peers-index.js'
import Long from 'long'
import { MtTypeAssertionError } from '../../../types/errors.js'
import { assertTypeIs } from '../../../utils/type-assertions.js'
import { makeInspectable } from '../../utils/inspectable.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { parseDocument } from '../media/document-utils.js'
import { parsePeer } from '../peers/peer.js'

export type InputStarGift
  = | {
    /** ID of the message containing the gift */
    message: number | Message
  }
  | {
    /** Owner of the gift */
    owner: InputPeerLike
    /** ID of the gift */
    savedId: tl.Long
  }
  | string // slug

/**
 * A gift bought with stars
 */
export class StarGift {
  constructor(
    readonly raw: tl.RawStarGift,
    readonly _peers: PeersIndex,
  ) {}

  /** ID of the gift */
  get id(): tl.Long {
    return this.raw.id
  }

  /** Whether this gift sold out and cannot be bought anymore */
  get isSoldOut(): boolean {
    return this.raw.soldOut!
  }

  /** Whether this gift has limited availability */
  get isLimited(): boolean {
    return this.raw.limited!
  }

  /** Whether this gift is available only to premium users */
  get isPremiumOnly(): boolean {
    return this.raw.requirePremium!
  }

  /** If this gift is currently sold through an auction, info about that auction. `null` otherwise */
  get action(): {
    slug: string
    giftsPerRound: number
  } | null {
    if (!this.raw.auctionSlug || this.raw.giftsPerRound == null) return null

    return {
      slug: this.raw.auctionSlug,
      giftsPerRound: this.raw.giftsPerRound,
    }
  }

  /** Whether this gift includes a peer color that can be applied to user's profile */
  get hasPeerColor(): boolean {
    return this.raw.peerColorAvailable!
  }

  /** Whether this gift is a unique gift */
  readonly isUnique = false as const

  /** Additional information for sold-out gifts */
  get soldOutInfo(): {
    /** Date when the first gift was bought */
    firstSale: Date
    /** Date when the last gift was bought */
    lastSale: Date
  } | null {
    if (this.raw.firstSaleDate == null || this.raw.lastSaleDate == null) {
      return null
    }

    return {
      firstSale: new Date(this.raw.firstSaleDate * 1000),
      lastSale: new Date(this.raw.lastSaleDate * 1000),
    }
  }

  /** Sticker associated with the gift */
  get sticker(): Sticker {
    assertTypeIs('StarGift#sticker', this.raw.sticker, 'document')
    const parsed = parseDocument(this.raw.sticker)

    if (parsed.type !== 'sticker') {
      throw new MtTypeAssertionError('StarGift#sticker', 'sticker', parsed.type)
    }

    return parsed
  }

  /** Amount of stars the gift was purchased for */
  get purchaseStars(): tl.Long {
    return this.raw.stars
  }

  /**
   * Amount of stars the gift can be converted to by the recipient
   */
  get convertStars(): tl.Long {
    return this.raw.convertStars
  }

  /**
   * Amount of stars the gift can be upgraded for
   */
  get upgradeStars(): tl.Long | null {
    return this.raw.upgradeStars ?? null
  }

  /**
   * For limited availability gifts,
   * the number of remaining and total gifts available
   */
  get availability(): {
    remains: number
    total: number

    /** Number of gifts available on the secondary market */
    resale: Long
  } | null {
    if (this.raw.availabilityRemains == null || this.raw.availabilityTotal == null) {
      return null
    }

    return {
      remains: this.raw.availabilityRemains,
      total: this.raw.availabilityTotal,
      resale: this.raw.availabilityResale ?? Long.ZERO,
    }
  }

  /**
   * For gifts with limited availability per user,
   * the number of remaining and total gifts available
   */
  get perUserAvailability(): {
    remains: number
    total: number
  } | null {
    if (!this.raw.limitedPerUser) return null

    return {
      // they share the same flag so they must be present
      remains: this.raw.perUserRemains!,
      total: this.raw.perUserTotal!,
    }
  }

  /** Floor price for the gift on the secondary market */
  get resaleFloorPrice(): tl.Long | null {
    return this.raw.resellMinStars ?? null
  }

  /** Title of the gift */
  get title(): string | null {
    return this.raw.title ?? null
  }

  /**
   * User/channel who released this collection
   */
  get releasedBy(): Peer | null {
    if (!this.raw.releasedBy) return null
    return parsePeer(this.raw.releasedBy, this._peers)
  }
}

makeInspectable(StarGift)
memoizeGetters(StarGift, ['sticker'])
