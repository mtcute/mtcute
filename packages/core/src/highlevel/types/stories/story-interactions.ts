import { tl } from '@mtcute/tl'

import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { PeersIndex } from '../peers/peers-index.js'
import { User } from '../peers/user.js'
import { ReactionCount } from '../reactions/reaction-count.js'

/**
 * Brief information about story views/interactions
 */
export class StoryInteractions {
    constructor(
        readonly raw: tl.RawStoryViews,
        readonly _peers: PeersIndex,
    ) {}

    /**
     * Whether information about viewers is available.
     *
     * When `true`, you can use {@link TelegarmClient.getStoryViewers}
     * to get the full list of viewers, and also {@link recentViewers}
     * will be available.
     */
    get hasViewers(): boolean {
        return this.raw.hasViewers!
    }

    /** Number of views */
    get viewsCount(): number {
        return this.raw.viewsCount
    }

    /** Number of forwards (if available) */
    get forwardsCount(): number | null {
        return this.raw.forwardsCount ?? null
    }

    /** Total number of reactions */
    get reactionsCount(): number {
        return this.raw.reactionsCount ?? 0
    }

    /**
     * Reactions on the message, along with their counts
     */
    get reactions(): ReactionCount[] {
        if (!this.raw.reactions) return []

        return this.raw.reactions.map((it) => new ReactionCount(it))
    }

    /**
     * List of users who have recently viewed this story.
     */
    get recentViewers(): User[] {
        return this.raw.recentViewers?.map((it) => new User(this._peers.user(it))) ?? []
    }
}

memoizeGetters(StoryInteractions, ['reactions', 'recentViewers'])
makeInspectable(StoryInteractions)
