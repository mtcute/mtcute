import { tl } from '@mtcute/tl'

import { getMarkedPeerId } from '../../../utils/peer-utils.js'
import { makeInspectable } from '../../utils/inspectable.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { parsePeer, Peer } from '../peers/peer.js'
import { PeersIndex } from '../peers/peers-index.js'

/**
 * Information about replies to a message
 */
export class MessageRepliesInfo {
    constructor(
        readonly raw: tl.RawMessageReplies,
        readonly _peers: PeersIndex,
    ) {}

    /**
     * Whether this message is a channel post that has a comments thread
     * in the linked discussion group
     */
    get hasComments(): boolean {
        return this.raw.comments!
    }

    /**
     * Total number of replies
     */
    get count(): number {
        return this.raw.replies
    }

    /**
     * Whether this reply thread has unread messages
     */
    get hasUnread(): boolean {
        return this.raw.readMaxId !== undefined && this.raw.readMaxId !== this.raw.maxId
    }

    /**
     * ID of the last message in the thread (if any)
     */
    get lastMessageId(): number | null {
        return this.raw.maxId ?? null
    }

    /**
     * ID of the last read message in the thread (if any)
     */
    get lastReadMessageId(): number | null {
        return this.raw.readMaxId ?? null
    }

    /**
     * ID of the discussion group for the post
     *
     * `null` if the post is not a channel post
     */
    get discussion(): number | null {
        if (!this.raw.channelId) return null

        return getMarkedPeerId(this.raw.channelId, 'channel')
    }

    /**
     * Last few commenters to the post (usually 3)
     */
    get repliers(): Peer[] {
        return this.raw.recentRepliers?.map((it) => parsePeer(it, this._peers)) ?? []
    }
}

memoizeGetters(MessageRepliesInfo, ['discussion', 'repliers'])
makeInspectable(MessageRepliesInfo)
