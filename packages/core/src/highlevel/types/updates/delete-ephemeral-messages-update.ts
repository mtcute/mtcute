import type { tl } from '../../../tl/index.js'
import type { Peer } from '../peers/peer.js'
import type { PeersIndex } from '../peers/peers-index.js'

import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { parsePeer } from '../peers/peer.js'

/**
 * One or more ephemeral messages were deleted
 */
export class DeleteEphemeralMessagesUpdate {
  constructor(
    readonly raw: tl.RawUpdateDeleteEphemeralMessages,
    readonly _peers: PeersIndex,
  ) {}

  /** Chat where the messages were deleted */
  get chat(): Peer {
    return parsePeer(this.raw.peer, this._peers)
  }

  /** IDs of the messages which were deleted */
  get messageIds(): number[] {
    return this.raw.ids
  }
}

memoizeGetters(DeleteEphemeralMessagesUpdate, ['chat'])
makeInspectable(DeleteEphemeralMessagesUpdate)
