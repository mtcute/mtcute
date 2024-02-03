import { tl } from '@mtcute/tl'

import { MtTypeAssertionError } from '../../../types/errors.js'
import { makeInspectable } from '../../utils/inspectable.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { Chat } from '../peers/chat.js'
import { parsePeer, PeerSender } from '../peers/peer.js'
import { PeersIndex } from '../peers/peers-index.js'
import { _messageMediaFromTl } from './message-media.js'

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
     * "Saved Messages"), the peer where the message was originally sent
     */
    fromChat(): Chat | null {
        if (!this.raw.savedFromPeer) return null

        return Chat._parseFromPeer(this.raw.savedFromPeer, this._peers)
    }

    /**
     * For messages forwarded from channels,
     * identifier of the original message in the channel
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
