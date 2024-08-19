import type { tl } from '@mtcute/tl'

import { getMarkedPeerId } from '../../../utils/peer-utils.js'
import { assertTypeIs } from '../../../utils/type-assertions.js'
import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import type { PeersIndex } from '../peers/peers-index.js'
import { User } from '../peers/user.js'
import { type Peer, parsePeer } from '../peers/peer.js'

import type { ReactionEmoji } from './types.js'
import { toReactionEmoji } from './types.js'

/**
 * Reactions of a user to a message
 */
export class PeerReaction {
    constructor(
        readonly raw: tl.RawMessagePeerReaction,
        readonly _peers: PeersIndex,
    ) {}

    /**
     * Emoji representing the reaction
     */
    get emoji(): ReactionEmoji {
        return toReactionEmoji(this.raw.reaction)
    }

    /**
     * Whether this is a big reaction
     */
    get big(): boolean {
        return this.raw.big!
    }

    /**
     * Whether this reaction is unread by the current user
     */
    get unread(): boolean {
        return this.raw.unread!
    }

    /**
     * ID of the user who has reacted
     */
    get userId(): number {
        return getMarkedPeerId(this.raw.peerId)
    }

    /**
     * User who has reacted
     */
    get user(): User {
        assertTypeIs('PeerReaction#user', this.raw.peerId, 'peerUser')

        return new User(this._peers.user(this.raw.peerId.userId))
    }
}

memoizeGetters(PeerReaction, ['user'])
makeInspectable(PeerReaction)

/**
 * Information about paid reactions of a single user to a message,
 * currently only used for a per-post leaderboard in the app.
 */
export class PaidPeerReaction {
    constructor(
        readonly raw: tl.RawMessageReactor,
        readonly _peers: PeersIndex,
    ) {}

    /** Whether this reaction is from the current user */
    get my(): boolean {
        return this.raw.my!
    }

    /** Whether this reaction was sent anonymously */
    get anonymous(): boolean {
        return this.raw.anonymous!
    }

    /**
     * If this reaction was not sent anonymously,
     * this field will contain the user who sent it
     */
    get peer(): Peer | null {
        if (!this.raw.peerId) return null
        return parsePeer(this.raw.peerId, this._peers)
    }

    /** Number of reactions sent by this user */
    get count(): number {
        return this.raw.count
    }
}

memoizeGetters(PaidPeerReaction, ['peer'])
makeInspectable(PaidPeerReaction)
