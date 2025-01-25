import type { tl } from '@mtcute/tl'
import type { TextWithEntities } from '../misc/entities.js'
import type { Peer } from '../peers/peer.js'
import type { PeersIndex } from '../peers/peers-index.js'
import { makeInspectable } from '../../utils/inspectable.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { parsePeer } from '../peers/peer.js'
import { StarGiftUnique } from './stars-gift-unique.js'
import { StarGift } from './stars-gift.js'

export class SavedStarGift {
    constructor(
        readonly raw: tl.RawSavedStarGift,
        readonly _peers: PeersIndex,
    ) {}

    /** Whether the sender name is hidden */
    get nameHidden(): boolean {
        return this.raw.nameHidden!
    }

    /** Whether this gift was not saved yet */
    get unsaved(): boolean {
        return this.raw.unsaved!
    }

    /** Whether this gift was refunded */
    get refunded(): boolean {
        return this.raw.refunded!
    }

    /** Whether this gift can be upgraded to a unique gift */
    get canUpgrade(): boolean {
        return this.raw.canUpgrade!
    }

    /** Sender of the gift */
    get sender(): Peer | null {
        return this.raw.fromId ? parsePeer(this.raw.fromId, this._peers) : null
    }

    /** Date when the gift was sent */
    get date(): Date {
        return new Date(this.raw.date * 1000)
    }

    /** The gift itself */
    get gift(): StarGift | StarGiftUnique {
        if (this.raw.gift._ === 'starGift') {
            return new StarGift(this.raw.gift)
        }

        return new StarGiftUnique(this.raw.gift, this._peers)
    }

    /** The attached message */
    get message(): TextWithEntities | null {
        return this.raw.message ?? null
    }

    /** ID of the message where the gift was originally sent (if available) */
    get messageId(): number | null {
        return this.raw.msgId ?? null
    }

    /** ID of the saved gift */
    get savedId(): tl.Long | null {
        return this.raw.savedId ?? null
    }

    /** Amount of stars the gift can be converted to by the recipient */
    get convertStars(): tl.Long | null {
        return this.raw.convertStars ?? null
    }

    /** Amount of stars needed to upgrade the gift to a unique gift */
    get upgradeStars(): tl.Long | null {
        return this.raw.upgradeStars ?? null
    }

    /** Amount of stars needed to transfer the gift */
    get transferStars(): tl.Long | null {
        return this.raw.transferStars ?? null
    }

    /** Date when the gift can be exported to blockchain */
    get canExportAt(): Date | null {
        return this.raw.canExportAt ? new Date(this.raw.canExportAt * 1000) : null
    }
}

makeInspectable(SavedStarGift)
memoizeGetters(SavedStarGift, ['sender', 'gift'])

export {
    /** @deprecated alias for {@link SavedStarGift} */
    SavedStarGift as UserStarGift,
}
