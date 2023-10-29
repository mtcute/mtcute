import { MtTypeAssertionError, tl } from '@mtcute/core'

import { makeInspectable } from '../../utils/inspectable.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { Chat } from '../peers/chat.js'
import { PeersIndex } from '../peers/peers-index.js'
import { User } from '../peers/user.js'
import { MessageEntity } from './message-entity.js'
import { _messageMediaFromTl, MessageMedia } from './message-media.js'

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
    get sender(): User | Chat | string {
        if (this.raw.fromName) {
            return this.raw.fromName
        }

        if (this.raw.fromId) {
            switch (this.raw.fromId._) {
                case 'peerChannel':
                    return new Chat(this._peers.chat(this.raw.fromId.channelId))
                case 'peerUser':
                    return new User(this._peers.user(this.raw.fromId.userId))
                default:
                    throw new MtTypeAssertionError('raw.fwdFrom.fromId', 'peerUser | peerChannel', this.raw.fromId._)
            }
        }

        throw new MtTypeAssertionError('MessageForwardInfo', 'to have fromId or fromName', 'neither')
    }

    /**
     * For "saved" messages (i.e. messages forwarded to yourself,
     * "Saved Messages"), the peer where the message was originally sent
     */
    fromChat(): User | Chat | null {
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

/**
 * Information about a message that this message is a reply to
 */
export class MessageReplyInfo {
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

    /**
     * If replied-to message is available, its ID
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
        return this.raw.replyToPeerId ? Chat._parseFromPeer(this.raw.replyToPeerId, this._peers) : null
    }

    /** If this message is a quote, text of the quote */
    get quoteText(): string {
        return this.raw.quoteText ?? ''
    }

    /** Message entities contained in the quote */
    get quoteEntities(): MessageEntity[] {
        return this.raw.quoteEntities?.map((e) => new MessageEntity(e)) ?? []
    }

    /**
     * Media contained in the replied-to message
     *
     * Only available in case the replied-to message is in a different chat
     * (i.e. {@link chat} is not `null`)
     */
    get media(): MessageMedia {
        if (!this.raw.replyMedia) return null

        return _messageMediaFromTl(this._peers, this.raw.replyMedia)
    }
}

memoizeGetters(MessageReplyInfo, ['chat', 'quoteEntities', 'media'])
makeInspectable(MessageReplyInfo)
