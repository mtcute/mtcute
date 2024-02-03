import { tl } from '@mtcute/tl'

import { makeInspectable } from '../../../utils/index.js'
import { ReactionEmoji, toReactionEmoji } from '../../reactions/index.js'
import { StoryInteractiveArea } from './base.js'

/**
 * Interactive element containing a reaction.
 *
 * Number of reactions should be taken from {@link StoryViews} by emoji ID
 *
 * For whatever reason, in MTProto dimensions of these are expected to be 16:9
 */
export class StoryInteractiveReaction extends StoryInteractiveArea {
    readonly type = 'reaction' as const

    constructor(readonly raw: tl.RawMediaAreaSuggestedReaction) {
        super(raw)
    }

    /** Whether this reaction is on a dark background */
    get isDark(): boolean {
        return this.raw.dark!
    }

    /** Whether this reaction is flipped (i.e. has tail on the left) */
    get isFlipped(): boolean {
        return this.raw.flipped!
    }

    /** Emoji representing the reaction */
    get emoji(): ReactionEmoji {
        return toReactionEmoji(this.raw.reaction)
    }
}

makeInspectable(StoryInteractiveReaction)
