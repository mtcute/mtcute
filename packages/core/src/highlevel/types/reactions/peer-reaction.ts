import { tl } from '@mtcute/tl'

import { getMarkedPeerId } from '../../../utils/peer-utils.js'
import { assertTypeIs } from '../../../utils/type-assertions.js'
import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { PeersIndex } from '../peers/peers-index.js'
import { User } from '../peers/user.js'
import { ReactionEmoji, toReactionEmoji } from './types.js'

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
