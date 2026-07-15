import type { tl } from '../../../tl/index.js'
import type { Peer } from './peer.js'
import type { PeersIndex } from './peers-index.js'

import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { parsePeer } from './peer.js'
import { User } from './user.js'

/**
 * A chat or user linked to a community
 */
export class CommunityPeer {
  constructor(
    readonly raw: tl.RawCommunityPeer,
    readonly _peers: PeersIndex,
  ) {}

  /** The linked peer itself */
  get peer(): Peer {
    return parsePeer(this.raw.peer, this._peers)
  }

  /**
   * Whether this peer is visible in the community's peer list,
   * or `null` if this information is not available
   */
  get isVisible(): boolean | null {
    return this.raw.visible ?? null
  }

  /** Whether the current user can view the history of this peer */
  get canViewHistory(): boolean {
    return this.raw.canViewHistory!
  }
}

memoizeGetters(CommunityPeer, ['peer'])
makeInspectable(CommunityPeer)

/**
 * A pending request to link a peer to a community
 */
export class CommunityPeerRequest {
  constructor(
    readonly raw: tl.RawCommunityPeerRequest,
    readonly _peers: PeersIndex,
  ) {}

  /** The peer that is requested to be linked */
  get peer(): Peer {
    return parsePeer(this.raw.peer, this._peers)
  }

  /** User who has requested the link */
  get requestedBy(): User {
    return new User(this._peers.user(this.raw.requestedBy))
  }

  /** Whether the peer is requested to be visible in the community's peer list */
  get isVisible(): boolean {
    return this.raw.visible!
  }

  /** Date when the request was sent */
  get date(): Date {
    return new Date(this.raw.date * 1000)
  }
}

memoizeGetters(CommunityPeerRequest, ['peer', 'requestedBy'])
makeInspectable(CommunityPeerRequest)
