import type { tl } from '@mtcute/tl'

import type { Peer, PeerSender } from '../peers/peer.js'
import type { PeersIndex } from '../peers/peers-index.js'
import { MtTypeAssertionError } from '../../../types/errors.js'
import { makeInspectable } from '../../utils/inspectable.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { parsePeer } from '../peers/peer.js'

/**
 * Information about forwarded message origin
 */
export class MessageForwardInfo {
  constructor(
    readonly raw: tl.RawMessageFwdHeader,
    readonly _peers: PeersIndex,
  ) {}

  /**
   * Date the original message was sent
   */
  get date(): Date {
    return new Date(this.raw.date * 1000)
  }

  /**
   * Sender of the original message (either user or a channel)
   * or their name (for users with private forwards)
   */
  get sender(): PeerSender {
    if (this.raw.fromName) {
      return {
        type: 'anonymous',
        displayName: this.raw.fromName,
      }
    }

    if (this.raw.fromId) {
      return parsePeer(this.raw.fromId, this._peers)
    }

    throw new MtTypeAssertionError('MessageForwardInfo', 'to have fromId or fromName', 'neither')
  }

  /**
   * For "saved" messages (i.e. messages forwarded to yourself,
   * "Saved Messages"), the peer where the message was originally sent.
   *
   * `null` for other messages, you might want to use {@link sender} instead
   */
  fromChat(): Peer | null {
    if (!this.raw.savedFromPeer) return null

    return parsePeer(this.raw.savedFromPeer, this._peers)
  }

  /**
   * For messages forwarded from channels,
   * identifier of the original message in the channel
   *
   * (only availale if {@link fromChat} is not `null`)
   */
  get fromMessageId(): number | null {
    return this.raw.savedFromMsgId ?? null
  }

  /**
   * For messages forwarded from channels,
   * signature of the post author (if present)
   */
  get signature(): string | null {
    return this.raw.postAuthor ?? null
  }
}

memoizeGetters(MessageForwardInfo, ['sender', 'fromChat'])
makeInspectable(MessageForwardInfo)
