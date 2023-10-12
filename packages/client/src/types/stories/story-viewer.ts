import { tl } from '@mtcute/core'

import { makeInspectable } from '../../utils'
import { memoizeGetters } from '../../utils/memoize'
import { PeersIndex, User } from '../peers'
import { ReactionEmoji, toReactionEmoji } from '../reactions'

/**
 * Information about a single user who has viewed a story.
 */
export class StoryViewer {
    constructor(
        readonly raw: tl.RawStoryView,
        readonly _peers: PeersIndex,
    ) {}

    /** Whether this user is in current user's global blacklist */
    get isBlocked(): boolean {
        return this.raw.blocked!
    }

    /** Whether current user's stories are hidden from this user */
    get isStoriesBlocked(): boolean {
        return this.raw.blockedMyStoriesFrom!
    }

    /** Date when the view has occurred */
    get date(): Date {
        return new Date(this.raw.date * 1000)
    }

    /** Reaction this user has left, if any */
    get reactionEmoji(): ReactionEmoji | null {
        if (!this.raw.reaction) return null

        return toReactionEmoji(this.raw.reaction, true)
    }

    /** Information about the user */
    get user(): User {
        return new User(this._peers.user(this.raw.userId))
    }
}

memoizeGetters(StoryViewer, ['user'])
makeInspectable(StoryViewer)

/**
 * List of story viewers.
 */
export class StoryViewersList {
    constructor(readonly raw: tl.stories.RawStoryViewsList) {}

    readonly _peers = PeersIndex.from(this.raw)

    /** Next offset for pagination */
    get next(): string | undefined {
        return this.raw.nextOffset
    }

    /** Total number of views this story has */
    get total(): number {
        return this.raw.count
    }

    /** Total number of reactions this story has */
    get reactionsTotal(): number {
        return this.raw.reactionsCount
    }

    /** List of viewers */
    get viewers(): StoryViewer[] {
        return this.raw.views.map((it) => new StoryViewer(it, this._peers))
    }
}

memoizeGetters(StoryViewersList, ['viewers'])
makeInspectable(StoryViewersList)
