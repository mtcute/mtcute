import type { tl } from '@mtcute/tl'

import type { Sticker } from '../media/sticker.js'
import type { Message } from '../messages/message.js'
import type { TextWithEntities } from '../misc/entities.js'
import type { InputPeerLike } from '../peers/peer.js'
import type { PeersIndex } from '../peers/peers-index.js'
import Long from 'long'
import { MtTypeAssertionError } from '../../../types/errors.js'
import { assertTypeIs } from '../../../utils/type-assertions.js'
import { makeInspectable } from '../../utils/inspectable.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { parseDocument } from '../media/document-utils.js'
import { User } from '../peers/user.js'
import { StarGiftUnique } from './stars-gift-unique.js'

export type InputStarGift =
  | {
      /** ID of the message containing the gift */
      message: number | Message
  }
  | {
      /** Owner of the gift */
      owner: InputPeerLike
      /** ID of the gift */
      savedId: tl.Long
  }

/**
 * A gift bought with stars
 */
export class StarGift {
    constructor(readonly raw: tl.RawStarGift) {}

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
    get availability(): { remains: number, total: number } | null {
        if (this.raw.availabilityRemains == null || this.raw.availabilityTotal == null) {
            return null
        }

        return {
            remains: this.raw.availabilityRemains,
            total: this.raw.availabilityTotal,
        }
    }
}

makeInspectable(StarGift)
memoizeGetters(StarGift, ['sticker'])

/**
 * Information about a certain user's {@link StarGift}.
 */
export class UserStarGift {
    constructor(
        readonly raw: tl.RawUserStarGift,
        readonly peers: PeersIndex,
    ) {}

    /** Whether the sender chose to appear anonymously */
    get nameHidden(): boolean {
        return this.raw.nameHidden!
    }

    /** Whether this gift is not visible on the recipient's profile */
    get hidden(): boolean {
        return this.raw.unsaved!
    }

    get isRefunded(): boolean {
        return this.raw.refunded!
    }

    /** Sender of the gift, if available */
    get sender(): User | null {
        return this.raw.fromId ? new User(this.peers.user(this.raw.fromId)) : null
    }

    /** Message ID where the gift was sent, if available */
    get messageId(): number | null {
        return this.raw.msgId ?? null
    }

    /** Date the gift was sent or minted */
    get date(): Date {
        return new Date(this.raw.date * 1000)
    }

    /** Whether the gift can be upgraded to a unique gift */
    get canUpgrade(): boolean {
        return this.raw.canUpgrade!
    }

    /** Number of stars to upgrade the gift to a unique gift (may be 0) */
    get upgradeStars(): tl.Long | null {
        if (!this.raw.canUpgrade) return null
        return this.raw.upgradeStars ?? Long.ZERO
    }

    /** The gift itself */
    get gift(): StarGift | StarGiftUnique {
        return this.raw.gift._ === 'starGift'
            ? new StarGift(this.raw.gift)
            : new StarGiftUnique(this.raw.gift, this.peers)
    }

    /** Text attached to the gift */
    get text(): TextWithEntities | null {
        return this.raw.message ?? null
    }

    /**
     * If the gift was converted to stars, the amount of stars
     * it was converted to
     */
    get convertStars(): tl.Long | null {
        return this.raw.convertStars ?? null
    }

    get canExportAt(): Date | null {
        return this.raw.canExportAt ? new Date(this.raw.canExportAt * 1000) : null
    }

    /** Number of stars this gift can be transferred for */
    get transferStars(): tl.Long | null {
        return this.raw.transferStars ?? null
    }
}

makeInspectable(UserStarGift)
memoizeGetters(UserStarGift, ['sender', 'gift'])
