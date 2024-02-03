import { tl } from '@mtcute/tl'

import { makeInspectable } from '../../utils/index.js'

/**
 * Information about boosts in a channel
 */
export class BoostStats {
    constructor(readonly raw: tl.premium.RawBoostsStatus) {}

    /** Whether this channel is being boosted by the current user */
    get isBoosting(): boolean {
        return this.raw.myBoost!
    }

    /**
     * Current level of boosts in this channel.
     *
     * Currently this maps 1-to-1 to the number of stories
     * the channel can post daily
     */
    get level(): number {
        return this.raw.level
    }

    /** Whether this channel is already at the maximum level */
    get isMaxLevel(): boolean {
        return this.raw.nextLevelBoosts === undefined
    }

    /**
     * The number of boosts acquired from created Telegram Premium
     * gift codes and giveaways, only available to channel admins
     */
    get gifts(): number {
        return this.raw.giftBoosts ?? 0
    }

    /**
     * Number of boosts that were needed for the current level
     */
    get currentLevelBoosts(): number {
        return this.raw.currentLevelBoosts
    }

    /** Total number of boosts this channel has */
    get currentBoosts(): number {
        return this.raw.boosts
    }

    /**
     * Number of boosts the channel must have to reach the next level
     *
     * `null` if the channel is already at the maximum level
     */
    get nextLevelBoosts(): number | null {
        return this.raw.nextLevelBoosts ?? null
    }

    /**
     * Number of boosts the channel needs in addition to the current value
     * to reach the next level
     */
    get remainingBoosts(): number {
        if (!this.raw.nextLevelBoosts) return 0

        return this.raw.nextLevelBoosts - this.raw.boosts
    }

    /** If available, total number of subscribers this channel has */
    get totalSubscribers(): number | null {
        return this.raw.premiumAudience?.total ?? null
    }

    /** If available, total number of Premium subscribers this channel has */
    get totalPremiumSubscribers(): number | null {
        return this.raw.premiumAudience?.part ?? null
    }

    /** If available, percentage of this channel's subscribers that are Premium */
    get premiumSubscribersPercentage(): number | null {
        if (!this.raw.premiumAudience) return null

        return (this.raw.premiumAudience.part / this.raw.premiumAudience.total) * 100
    }

    /** URL that would bring up the boost interface */
    get url(): string {
        return this.raw.boostUrl
    }

    /**
     * If {@link isBoosting}, IDs of the boost slots that are
     * currently occupied by this channel
     */
    get boostSlots(): number[] {
        return this.raw.myBoostSlots ?? []
    }
}

makeInspectable(BoostStats)
