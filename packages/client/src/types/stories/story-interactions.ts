import { tl } from '@mtcute/core'

import { TelegramClient } from '../../client'
import { makeInspectable } from '../../utils'
import { PeersIndex, User } from '../peers'
import { ReactionCount } from '../reactions/reaction-count'

/**
 * Brief information about story views/interactions
 */
export class StoryInteractions {
    constructor(readonly client: TelegramClient, readonly raw: tl.RawStoryViews, readonly _peers: PeersIndex) {}

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

    private _reactions?: ReactionCount[]
    /**
     * Reactions on the message, along with their counts
     */
    get reactions(): ReactionCount[] {
        if (!this.raw.reactions) return []

        return (this._reactions ??= this.raw.reactions.map((it) => new ReactionCount(it)))
    }

    private _recentViewers?: User[]
    /**
     * List of users who have recently viewed this story.
     */
    get recentViewers(): User[] {
        if (!this._recentViewers) {
            this._recentViewers = this.raw.recentViewers?.map((it) => new User(this.client, this._peers.user(it))) ?? []
        }

        return this._recentViewers
    }
}

makeInspectable(StoryInteractions)
