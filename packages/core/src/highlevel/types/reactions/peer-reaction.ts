import type { tl } from '../../../tl/index.js'

import type { Peer } from '../peers/peer.js'
import type { PeersIndex } from '../peers/peers-index.js'
import type { ReactionEmoji } from './types.js'
import { getMarkedPeerId } from '../../../utils/peer-utils.js'
import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { parsePeer } from '../peers/peer.js'

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
   * ID of the peer who has reacted
   */
  get peerId(): number {
    return getMarkedPeerId(this.raw.peerId)
  }

  /**
   * User who has reacted
   */
  get peer(): Peer {
    return parsePeer(this.raw.peerId, this._peers)
  }
}

memoizeGetters(PeerReaction, ['peer'])
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
