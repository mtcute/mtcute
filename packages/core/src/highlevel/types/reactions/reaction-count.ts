import { tl } from '@mtcute/tl'

import { makeInspectable } from '../../utils/index.js'
import { ReactionEmoji, toReactionEmoji } from './types.js'

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
