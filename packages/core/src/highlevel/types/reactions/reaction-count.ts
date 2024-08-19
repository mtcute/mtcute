import type { tl } from '@mtcute/tl'

import { makeInspectable } from '../../utils/index.js'

import type { ReactionEmoji } from './types.js'
import { toReactionEmoji } from './types.js'

/**
 * Reaction count
 */
export class ReactionCount {
    constructor(readonly raw: tl.RawReactionCount) {}

    /**
     * Emoji representing the reaction
     */
    get emoji(): ReactionEmoji {
        return toReactionEmoji(this.raw.reaction)
    }

    /** Whether this is a paid reaction */
    get isPaid(): boolean {
        return this.raw.reaction._ === 'reactionPaid'
    }

    /**
     * Number of users who reacted with this emoji
     */
    get count(): number {
        return this.raw.count
    }

    /**
     * If the current user has reacted with this emoji,
     * this field will contain the order in which the
     * reaction was added.
     */
    get order(): number | null {
        return this.raw.chosenOrder ?? null
    }
}

makeInspectable(ReactionCount)
