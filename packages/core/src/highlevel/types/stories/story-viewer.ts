import { tl } from '@mtcute/tl'

import { MtTypeAssertionError } from '../../../types/errors.js'
import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { Message } from '../messages/index.js'
import { parsePeer, Peer, PeersIndex, User } from '../peers/index.js'
import { ReactionEmoji, toReactionEmoji } from '../reactions/index.js'
import { Story } from './story.js'

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
 * Kind of a story repost.
 * - `forward` - a story has been forwarded somewhere
 * - `repost` - a story has been reposted as a story
 */
export type StoryRepostKind = 'forward' | 'repost'

/**
 * Information about a single story repost.
 */
export class StoryRepost {
    constructor(
        readonly raw: tl.RawStoryViewPublicForward | tl.RawStoryViewPublicRepost,
        readonly _peers: PeersIndex,
    ) {}

    /** Whether this peer is in current user's global blacklist */
    get isBlocked(): boolean {
        return this.raw.blocked!
    }

    /** Whether current user's stories are hidden from this peer */
    get isStoriesBlocked(): boolean {
        return this.raw.blockedMyStoriesFrom!
    }

    /** Kind of the repost */
    get kind(): StoryRepostKind {
        return this.raw._ === 'storyViewPublicForward' ? 'forward' : 'repost'
    }

    /** Date when the repost has happened */
    get date(): Date {
        if (this.raw._ === 'storyViewPublicForward' && this.raw.message._ === 'message') {
            return new Date(this.raw.message.date * 1000)
        }

        if (this.raw._ === 'storyViewPublicRepost' && this.raw.story._ === 'storyItem') {
            return new Date(this.raw.story.date * 1000)
        }

        throw new MtTypeAssertionError('StoryRepost', 'date', 'none')
    }

    /**
     * Message that has been forwarded/reposted.
     *
     * Only available if {@link kind} is `forward`.
     */
    get message(): Message | null {
        if (this.raw._ === 'storyViewPublicRepost') return null

        return new Message(this.raw.message, this._peers)
    }

    /**
     * Story that has been reposted.
     *
     * Only available if {@link kind} is `repost`.
     */
    get story(): Story | null {
        if (this.raw._ === 'storyViewPublicForward') return null
        if (this.raw.story._ !== 'storyItem') return null

        return new Story(this.raw.story, this._peers)
    }

    /** Information about the peer who has made the reposted */
    get peer(): Peer {
        if (this.raw._ === 'storyViewPublicForward') {
            return this.message!.sender
        }

        return parsePeer(this.raw.peerId, this._peers)
    }
}

/**
 * List of story viewers.
 */
export class StoryViewersList {
    readonly _peers: PeersIndex
    constructor(readonly raw: tl.stories.RawStoryViewsList) {
        this._peers = PeersIndex.from(this.raw)
    }

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
        const res: StoryViewer[] = []

        for (const view of this.raw.views) {
            if (view._ === 'storyView') {
                res.push(new StoryViewer(view, this._peers))
            }
        }

        return res
    }
}

memoizeGetters(StoryViewersList, ['viewers'])
makeInspectable(StoryViewersList)
