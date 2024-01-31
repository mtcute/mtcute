import { tl } from '@mtcute/tl'

import { MtUnsupportedError } from '../../../types/errors.js'
import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { PeersIndex, User } from '../peers/index.js'

/**
 * Origin of a boost
 *
 * - `gift` - boost applied because the channel gifted a subscription to some user
 * - `unclaimed_gift` - boost applied because the channel gifted a subscription to some user,
 *   but the user hasn't yet claimed it
 * - `giveaway` - boost applied because the user was chosen in a giveaway
 * - `user` - boost applied because the user directly boosted the channel
 */
type BoostOrigin = 'gift' | 'unclaimed_gift' | 'giveaway' | 'user'

/**
 * Information about a boost (one or more)
 */
export class Boost {
    constructor(
        readonly raw: tl.RawBoost,
        readonly _peers: PeersIndex,
    ) {}

    /** Unique ID of this boost */
    get id(): string {
        return this.raw.id
    }

    /** Number of boosts this boost is actually representing */
    get count(): number {
        return this.raw.multiplier ?? 1
    }

    /** Date when this boost was applied */
    get date(): Date {
        return new Date(this.raw.date * 1000)
    }

    /**
     * Date when this boost will automatically expire.
     *
     * > **Note**: User can still manually cancel the boost before that date
     */
    get expireDate(): Date {
        return new Date(this.raw.expires * 1000)
    }

    /**
     * Whether this boost was applied because the channel
     * directly gifted a subscription to the user
     */
    get origin(): BoostOrigin {
        if (this.raw.unclaimed) return 'unclaimed_gift'
        if (this.raw.gift) return 'gift'
        if (this.raw.giveaway) return 'giveaway'
        if (this.raw.userId) return 'user'

        throw new MtUnsupportedError('Unknown boost origin')
    }

    /**
     * User who is boosting the channel.
     *
     * Only available for some origins
     */
    get user(): User | null {
        if (!this.raw.userId) return null

        return new User(this._peers.user(this.raw.userId))
    }

    /**
     * ID of the message containing the giveaway where this
     * user has won
     */
    get giveawayMessageId(): number | null {
        return this.raw.giveawayMsgId ?? null
    }

    /**
     * The created Telegram Premium gift code, only set if `origin` is not `user`,
     * AND it is either a gift code for the currently logged in user,
     * or if it was already claimed
     */
    get usedGiftSlug(): string | null {
        return this.raw.usedGiftSlug ?? null
    }
}

memoizeGetters(Boost, ['user'])
makeInspectable(Boost)
