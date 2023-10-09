import {
    assertNever,
    getMarkedPeerId,
    MtArgumentError,
    MtTypeAssertionError,
    tl,
    toggleChannelIdMark,
} from '@mtcute/core'
import { assertTypeIsNot } from '@mtcute/core/utils'

import { makeInspectable } from '../../utils'
import { BotKeyboard, ReplyMarkup } from '../bots/keyboards'
import { Chat } from '../peers/chat'
import { PeersIndex } from '../peers/peers-index'
import { User } from '../peers/user'
import { _messageActionFromTl, MessageAction } from './message-action'
import { MessageEntity } from './message-entity'
import { _messageMediaFromTl, MessageMedia } from './message-media'
import { MessageReactions } from './message-reactions'

/** Information about a forward */
export interface MessageForwardInfo {
    /**
     * Date the original message was sent
     */
    date: Date

    /**
     * Sender of the original message (either user or a channel)
     * or their name (for users with private forwards)
     */
    sender: User | Chat | string

    /**
     * For messages forwarded from channels,
     * identifier of the original message in the channel
     */
    fromMessageId?: number

    /**
     * For messages forwarded from channels,
     * signature of the post author (if present)
     */
    signature?: string
}

/** Information about replies to a message */
export interface MessageRepliesInfo {
    /**
     * Whether this is a comments thread under a channel post
     */
    isComments: false

    /**
     * Total number of replies
     */
    count: number

    /**
     * Whether this reply thread has unread messages
     */
    hasUnread: boolean

    /**
     * ID of the last message in the thread (if any)
     */
    lastMessageId?: number

    /**
     * ID of the last read message in the thread (if any)
     */
    lastReadMessageId?: number
}

/** Information about comments to a channel post */
export interface MessageCommentsInfo extends Omit<MessageRepliesInfo, 'isComments'> {
    /**
     * Whether this is a comments thread under a channel post
     */
    isComments: true

    /**
     * ID of the discussion group for the post
     */
    discussion: number

    /**
     * IDs of the last few commenters to the post
     */
    repliers: number[]
}

/**
 * A Telegram message.
 */
export class Message {
    /**
     * Raw TL object.
     */
    readonly raw: tl.RawMessage | tl.RawMessageService

    constructor(
        raw: tl.TypeMessage,
        readonly _peers: PeersIndex,
        /**
         * Whether the message is scheduled.
         * If it is, then its {@link date} is set to future.
         */
        readonly isScheduled = false,
    ) {
        assertTypeIsNot('Message#ctor', raw, 'messageEmpty')

        this.raw = raw
    }

    /** Unique message identifier inside this chat */
    get id(): number {
        return this.raw.id
    }

    /**
     * For channel posts, number of views
     *
     * `null` for service messages and non-post messages.
     */
    get views(): number | null {
        return this.raw._ === 'message' ? this.raw.views ?? null : null
    }

    /**
     * Whether the message is incoming or outgoing:
     *  - Messages received from other chats are incoming (`outgoing = false`)
     *  - Messages sent by you to other chats are outgoing (`outgoing = true`)
     *  - Messages to yourself (i.e. *Saved Messages*) are incoming (`outgoing = false`)
     */
    get isOutgoing(): boolean {
        return this.raw.out!
    }

    /**
     * Whether this message is a service message
     */
    get isService(): boolean {
        return this.raw._ === 'messageService'
    }

    /** Whether this message has content protection (i.e. disabled forwards) */
    get isContentProtected(): boolean {
        return this.raw._ === 'message' && this.raw.noforwards!
    }

    /**
     * Multiple media messages with the same grouped ID
     * indicate an album or media group
     *
     * `null` for service messages and non-grouped messages
     */
    get groupedId(): tl.Long | null {
        return this.raw._ === 'message' ? this.raw.groupedId ?? null : null
    }

    /**
     * Same as {@link groupedId}, but is globally unique across chats.
     */
    get groupedIdUnique(): string | null {
        if (!(this.raw._ === 'message' && this.raw.groupedId !== undefined)) return null

        return `${this.raw.groupedId.low}|${this.raw.groupedId.high}|${getMarkedPeerId(this.raw.peerId)}`
    }

    private _sender?: User | Chat

    /**
     * Message sender.
     *
     * Usually is a {@link User}, but can be a {@link Chat}
     * in case the message was sent by an anonymous admin,
     * or if the message is a forwarded channel post.
     *
     * If the message was sent by an anonymous admin,
     * sender will equal to {@link chat}.
     *
     * If the message is a forwarded channel post,
     * sender is the channel itself.
     */
    get sender(): User | Chat {
        if (this._sender === undefined) {
            const from = this.raw.fromId

            if (!from) {
                if (this.raw.peerId._ === 'peerUser') {
                    this._sender = new User(this._peers.user(this.raw.peerId.userId))
                } else {
                    // anon admin, return the chat
                    this._sender = this.chat
                }
            } else {
                switch (from._) {
                    case 'peerChannel': // forwarded channel post
                        this._sender = new Chat(this._peers.chat(from.channelId))
                        break
                    case 'peerUser':
                        this._sender = new User(this._peers.user(from.userId))
                        break
                    default:
                        throw new MtTypeAssertionError('raw.fromId', 'peerUser | peerChannel', from._)
                }
            }
        }

        return this._sender
    }

    private _chat?: Chat

    /**
     * Conversation the message belongs to
     */
    get chat(): Chat {
        if (this._chat === undefined) {
            this._chat = Chat._parseFromMessage(this.raw, this._peers)
        }

        return this._chat
    }

    /**
     * Date the message was sent
     */
    get date(): Date {
        return new Date(this.raw.date * 1000)
    }

    private _forward?: MessageForwardInfo | null

    /**
     * If this message is a forward, contains info about it.
     */
    get forward(): MessageForwardInfo | null {
        if (!this._forward) {
            if (this.raw._ !== 'message' || !this.raw.fwdFrom) {
                this._forward = null
            } else {
                const fwd = this.raw.fwdFrom

                let sender: User | Chat | string

                if (fwd.fromName) {
                    sender = fwd.fromName
                } else if (fwd.fromId) {
                    switch (fwd.fromId._) {
                        case 'peerChannel':
                            sender = new Chat(this._peers.chat(fwd.fromId.channelId))
                            break
                        case 'peerUser':
                            sender = new User(this._peers.user(fwd.fromId.userId))
                            break
                        default:
                            throw new MtTypeAssertionError('raw.fwdFrom.fromId', 'peerUser | peerChannel', fwd.fromId._)
                    }
                } else {
                    this._forward = null

                    return this._forward
                }

                this._forward = {
                    date: new Date(fwd.date * 1000),
                    sender,
                    fromMessageId: fwd.savedFromMsgId,
                    signature: fwd.postAuthor,
                }
            }
        }

        return this._forward
    }

    /**
     * Whether the message is a channel post that was
     * automatically forwarded to the connected discussion group
     */
    get isAutomaticForward(): boolean {
        if (this.raw._ === 'messageService' || !this.raw.fwdFrom) return false

        const fwd = this.raw.fwdFrom

        return Boolean(
            this.chat.chatType === 'supergroup' &&
                fwd.channelPost &&
                fwd.savedFromMsgId &&
                fwd.savedFromPeer?._ === 'peerChannel',
        )
    }

    private _replies?: MessageRepliesInfo | MessageCommentsInfo
    /**
     * Information about comments (for channels) or replies (for groups)
     */
    get replies(): MessageRepliesInfo | MessageCommentsInfo | null {
        if (this.raw._ !== 'message' || !this.raw.replies) return null

        if (!this._replies) {
            const r = this.raw.replies
            const obj: MessageRepliesInfo = {
                isComments: r.comments as false,
                count: r.replies,
                hasUnread: r.readMaxId !== undefined && r.readMaxId !== r.maxId,
                lastMessageId: r.maxId,
                lastReadMessageId: r.readMaxId,
            }

            if (r.comments) {
                const o = obj as unknown as MessageCommentsInfo
                o.discussion = getMarkedPeerId(r.channelId!, 'channel')
                o.repliers = r.recentRepliers?.map((it) => getMarkedPeerId(it)) ?? []
            }

            this._replies = obj
        }

        return this._replies
    }

    /**
     * For replies, the ID of the message that current message
     * replies to.
     */
    get replyToMessageId(): number | null {
        if (this.raw.replyTo?._ !== 'messageReplyHeader') return null

        return this.raw.replyTo.replyToMsgId ?? null
    }

    /**
     * For replies, ID of the thread/topic
     * (i.e. ID of the top message in the thread/topic)
     */
    get replyToThreadId(): number | null {
        if (this.raw.replyTo?._ !== 'messageReplyHeader') return null

        return this.raw.replyTo.replyToTopId ?? null
    }

    /**
     * For replies, information about the story that is being replied to
     */
    get replyToStoryId(): tl.RawMessageReplyStoryHeader | null {
        if (this.raw.replyTo?._ !== 'messageReplyStoryHeader') return null

        return this.raw.replyTo
    }

    /** Whether this message is in a forum topic */
    get isTopicMessage(): boolean {
        if (this.raw.replyTo?._ !== 'messageReplyHeader') return false

        return this.raw.replyTo.forumTopic!
    }

    /**
     * Whether this message contains mention of the current user
     */
    get isMention(): boolean {
        return this.raw.mentioned!
    }

    private _viaBot?: User | null
    /**
     * If this message is generated from an inline query,
     * information about the bot which generated it
     */
    get viaBot(): User | null {
        if (this._viaBot === undefined) {
            if (this.raw._ === 'messageService' || !this.raw.viaBotId) {
                this._viaBot = null
            } else {
                this._viaBot = new User(this._peers.user(this.raw.viaBotId))
            }
        }

        return this._viaBot
    }

    /**
     * Message text or media caption.
     *
     * Empty string for service messages
     * (you should handle i18n yourself)
     */
    get text(): string {
        return this.raw._ === 'messageService' ? '' : this.raw.message
    }

    private _entities?: MessageEntity[]
    /**
     * Message text/caption entities (may be empty)
     */
    get entities(): ReadonlyArray<MessageEntity> {
        if (!this._entities) {
            this._entities = []

            if (this.raw._ === 'message' && this.raw.entities?.length) {
                for (const ent of this.raw.entities) {
                    this._entities.push(new MessageEntity(ent, this.raw.message))
                }
            }
        }

        return this._entities
    }

    private _action?: MessageAction
    /**
     * Message action. `null` for non-service messages
     * or for unsupported events.
     *
     * For unsupported events, use `.raw.action` directly.
     */
    get action(): MessageAction | null {
        if (!this._action) {
            if (this.raw._ === 'message') {
                this._action = null
            } else {
                this._action = _messageActionFromTl.call(this, this.raw.action)
            }
        }

        return this._action
    }

    private _media?: MessageMedia
    /**
     * Message media. `null` for text-only and service messages
     * and for unsupported media types.
     *
     * For unsupported media types, use `.raw.media` directly.
     */
    get media(): MessageMedia {
        if (this._media === undefined) {
            if (this.raw._ === 'messageService' || !this.raw.media || this.raw.media._ === 'messageMediaEmpty') {
                this._media = null
            } else {
                this._media = _messageMediaFromTl(this._peers, this.raw.media)
            }
        }

        return this._media!
    }

    /**
     * Whether this is a premium media
     * (e.g. >2gb file or fullscreen sticker)
     * that was forwarded without author by a non-premium user
     */
    get isForwardedPremiumMedia(): boolean {
        return this.raw._ === 'message' && this.raw.media?._ === 'messageMediaDocument' && this.raw.media.nopremium!
    }

    /**
     * TTL period of the message, in seconds.
     */
    get ttlPeriod(): number | null {
        return this.raw.ttlPeriod ?? null
    }

    private _markup?: ReplyMarkup | null
    /**
     * Reply markup provided with this message, if any.
     */
    get markup(): ReplyMarkup | null {
        if (this._markup === undefined) {
            if (this.raw._ === 'messageService' || !this.raw.replyMarkup) {
                this._markup = null
            } else {
                const rm = this.raw.replyMarkup
                let markup: ReplyMarkup | null

                switch (rm._) {
                    case 'replyKeyboardHide':
                        markup = {
                            type: 'reply_hide',
                            selective: rm.selective,
                        }
                        break
                    case 'replyKeyboardForceReply':
                        markup = {
                            type: 'force_reply',
                            singleUse: rm.singleUse,
                            selective: rm.selective,
                        }
                        break
                    case 'replyKeyboardMarkup':
                        markup = {
                            type: 'reply',
                            resize: rm.resize,
                            singleUse: rm.singleUse,
                            selective: rm.selective,
                            buttons: BotKeyboard._rowsTo2d(rm.rows),
                        }
                        break
                    case 'replyInlineMarkup':
                        markup = {
                            type: 'inline',
                            buttons: BotKeyboard._rowsTo2d(rm.rows),
                        }
                        break
                    default:
                        assertNever(rm)
                }

                this._markup = markup
            }
        }

        return this._markup
    }

    /**
     * Whether this message can be forwarded
     *
     * `false` for service mesasges and private restricted chats/chanenls
     */
    get canBeForwarded(): boolean {
        return this.raw._ === 'message' && !this.raw.noforwards
    }

    private _reactions?: MessageReactions | null
    get reactions(): MessageReactions | null {
        if (this._reactions === undefined) {
            if (this.raw._ === 'messageService' || !this.raw.reactions) {
                this._reactions = null
            } else {
                this._reactions = new MessageReactions(
                    this.raw.id,
                    getMarkedPeerId(this.raw.peerId),
                    this.raw.reactions,
                    this._peers,
                )
            }
        }

        return this._reactions
    }

    /**
     * Generated permalink to this message, only for groups and channels
     *
     * @throws MtArgumentError  In case the chat does not support message links
     */
    get link(): string {
        if (this.chat.chatType === 'supergroup' || this.chat.chatType === 'channel') {
            if (this.chat.username) {
                return `https://t.me/${this.chat.username}/${this.id}`
            }

            return `https://t.me/c/${toggleChannelIdMark(this.chat.id)}/${this.id}`
        }

        throw new MtArgumentError(`Cannot generate message link for ${this.chat.chatType}`)
    }
}

makeInspectable(Message, ['isScheduled'], ['link'])
