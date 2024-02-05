import { tl } from '@mtcute/tl'

import { MtTypeAssertionError } from '../../../types/errors.js'
import { makeInspectable } from '../../utils/inspectable.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { Chat } from '../peers/chat.js'
import { PeerSender } from '../peers/peer.js'
import { PeersIndex } from '../peers/peers-index.js'
import { User } from '../peers/user.js'
import { MessageEntity } from './message-entity.js'
import { _messageMediaFromTl, MessageMedia } from './message-media.js'

/**
 * Origin of the replied-to message
 *  - `same_chat` — reply to a message in the same chat as this message
 *  - `other_chat` — reply to a message in a different chat
 *  - `private` — reply to a message in a private chat
 */
export type RepliedMessageOrigin = 'same_chat' | 'other_chat' | 'private'

/** @hidden */
export interface _RepliedMessageAssertionsByOrigin {
    same_chat: {
        id: number
        chat: null
        media: null
        sender: null
    }
    other_chat: {
        id: number
        chat: Chat
        sender: PeerSender
    }
    private: {
        id: null
        chat: null
        sender: PeerSender
    }
}

/**
 * Information about a message that this message is a reply to
 */
export class RepliedMessageInfo {
    constructor(
        readonly raw: tl.RawMessageReplyHeader,
        readonly _peers: PeersIndex,
    ) {}

    /** Whether this message is a reply to another scheduled message */
    get isScheduled(): boolean {
        return this.raw.replyToScheduled!
    }

    /** Whether this message was sent to a forum topic */
    get isForumTopic(): boolean {
        return this.raw.forumTopic!
    }

    /** Whether this message is quoting another message */
    get isQuote(): boolean {
        return this.raw.quote!
    }

    /** Origin of the replied-to message */
    get origin(): RepliedMessageOrigin {
        if (!this.raw.replyToMsgId) return 'private'
        if (!this.raw.replyFrom) return 'same_chat'

        return 'other_chat'
    }

    /**
     * Helper method to check {@link origin} that will also
     * narrow the type of this object respectively
     */
    originIs<T extends RepliedMessageOrigin>(
        origin: T,
    ): this is RepliedMessageInfo & _RepliedMessageAssertionsByOrigin[T] {
        if (this.origin === origin) {
            // do some type assertions just in case
            switch (origin) {
                case 'same_chat':
                    // no need, `null` is pretty safe, and `id` is checked in `origin` getter
                    return true
                case 'other_chat':
                    // replyToMsgId != null, replyFrom != null. checking for replyToPeerId is enough
                    return this.raw.replyToPeerId !== undefined
                case 'private':
                    // replyFrom.fromId should be available
                    return this.raw.replyFrom?.fromId !== undefined
            }
        }

        return false
    }

    /**
     * For non-`private` origin, ID of the replied-to message in the original chat.
     */
    get id(): number | null {
        return this.raw.replyToMsgId ?? null
    }

    /** ID of the replies thread where this message belongs to */
    get threadId(): number | null {
        return this.raw.replyToTopId ?? null
    }

    /**
     * If replied-to message is available, chat where the message was sent.
     *
     * If `null`, the message was sent in the same chat.
     */
    get chat(): Chat | null {
        if (!this.raw.replyToPeerId || !this.raw.replyFrom) {
            // same chat or private. even if `replyToPeerId` is available,
            // without `replyFrom` it would contain the sender, not the chat
            return null
        }

        return Chat._parseFromPeer(this.raw.replyToPeerId, this._peers)
    }

    /**
     * Sender of the replied-to message (either user or a channel)
     * or their name (for users with private forwards).
     *
     * For replies to channel messages, this will be the channel itself.
     *
     * `null` if the sender is not available (for `same_chat` origin)
     */
    get sender(): PeerSender | null {
        const { replyFrom, replyToPeerId } = this.raw
        if (!replyFrom && !replyToPeerId) return null

        if (replyFrom?.fromName) {
            return {
                type: 'anonymous',
                displayName: replyFrom.fromName,
            }
        }

        const peer = replyFrom?.fromId ?? replyToPeerId

        if (peer) {
            switch (peer._) {
                case 'peerChannel':
                    return new Chat(this._peers.chat(peer.channelId))
                case 'peerUser':
                    return new User(this._peers.user(peer.userId))
                default:
                    throw new MtTypeAssertionError('fromId ?? replyToPeerId', 'peerUser | peerChannel', peer._)
            }
        }

        throw new MtTypeAssertionError('replyFrom', 'to have fromId, replyToPeerId or fromName', 'neither')
    }

    /**
     * For non-`same_chat` origin, date the original message was sent.
     */
    get date(): Date | null {
        if (!this.raw.replyFrom?.date) return null

        return new Date(this.raw.replyFrom.date * 1000)
    }

    /**
     * If this message is a quote, text of the quote.
     *
     * For non-`same_chat` origin, this will be the full text of the
     * replied-to message in case `.isQuote` is `false`
     */
    get quoteText(): string {
        return this.raw.quoteText ?? ''
    }

    /** Message entities contained in the quote */
    get quoteEntities(): MessageEntity[] {
        return this.raw.quoteEntities?.map((e) => new MessageEntity(e)) ?? []
    }

    /**
     * Offset of the start of the {@link quoteText} in the replied-to message.
     *
     * Note that this offset should only be used as a hint, as the actual
     * quote offset may be different due to message being edited after the quote
     *
     * `null` if not available, in which case it should be assumed that the quote
     * starts at `.indexOf(quoteText)` of the replied-to message text.
     */
    get quoteOffset(): number | null {
        if (!this.raw.quoteOffset) return null

        return this.raw.quoteOffset
    }

    /**
     * Media contained in the replied-to message
     *
     * Only available for non-`same_chat` origin
     */
    get media(): MessageMedia {
        if (!this.raw.replyMedia) return null

        return _messageMediaFromTl(this._peers, this.raw.replyMedia)
    }
}

memoizeGetters(RepliedMessageInfo, ['chat', 'sender', 'quoteEntities', 'media'])
makeInspectable(RepliedMessageInfo)
