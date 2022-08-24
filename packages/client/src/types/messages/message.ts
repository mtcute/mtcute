import { tl } from '@mtcute/tl'
import { assertNever, getMarkedPeerId, toggleChannelIdMark } from '@mtcute/core'

import { User, Chat, InputPeerLike, PeersIndex } from '../peers'
import { BotKeyboard, ReplyMarkup } from '../bots'
import { MtArgumentError, MtTypeAssertionError } from '../errors'
import { TelegramClient } from '../../client'
import { MessageEntity } from './message-entity'
import { makeInspectable } from '../utils'
import { InputMediaLike, Sticker, WebPage } from '../media'
import { _messageActionFromTl, MessageAction } from './message-action'
import { _messageMediaFromTl, MessageMedia } from './message-media'
import { FormattedString } from '../parser'
import { MessageReactions } from './reactions'

/**
 * A message or a service message
 */
export namespace Message {
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
    export interface MessageCommentsInfo
        extends Omit<MessageRepliesInfo, 'isComments'> {
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
        readonly client: TelegramClient,
        raw: tl.TypeMessage,
        readonly _peers: PeersIndex,
        /**
         * Whether the message is scheduled.
         * If it is, then its {@link Message.date} is set to future.
         */
        readonly isScheduled = false
    ) {
        if (raw._ === 'messageEmpty')
            throw new MtTypeAssertionError(
                'Message#ctor',
                'not messageEmpty',
                'messageEmpty'
            )

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

    /**
     * Multiple media messages with the same grouped ID
     * indicate an album or media group
     *
     * `null` for service messages and non-grouped messages
     */
    get groupedId(): tl.Long | null {
        return this.raw._ === 'message' ? this.raw.groupedId ?? null : null
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
                    this._sender = new User(
                        this.client,
                        this._peers.user(this.raw.peerId.userId)
                    )
                } else {
                    // anon admin, return the chat
                    this._sender = this.chat
                }
            } else
                switch (from._) {
                    case 'peerChannel': // forwarded channel post
                        this._sender = new Chat(
                            this.client,
                            this._peers.chat(from.channelId)
                        )
                        break
                    case 'peerUser':
                        this._sender = new User(
                            this.client,
                            this._peers.user(from.userId)
                        )
                        break
                    default:
                        throw new MtTypeAssertionError(
                            'raw.fromId',
                            'peerUser | peerChannel',
                            from._
                        )
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
            this._chat = Chat._parseFromMessage(
                this.client,
                this.raw,
                this._peers
            )
        }

        return this._chat
    }

    /**
     * Date the message was sent
     */
    get date(): Date {
        return new Date(this.raw.date * 1000)
    }

    private _forward?: Message.MessageForwardInfo | null

    /**
     * If this message is a forward, contains info about it.
     */
    get forward(): Message.MessageForwardInfo | null {
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
                            sender = new Chat(
                                this.client,
                                this._peers.chat(fwd.fromId.channelId)
                            )
                            break
                        case 'peerUser':
                            sender = new User(
                                this.client,
                                this._peers.user(fwd.fromId.userId)
                            )
                            break
                        default:
                            throw new MtTypeAssertionError(
                                'raw.fwdFrom.fromId',
                                'peerUser | peerChannel',
                                fwd.fromId._
                            )
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

    private _replies?: Message.MessageRepliesInfo | Message.MessageCommentsInfo
    /**
     * Information about comments (for channels) or replies (for groups)
     */
    get replies():
        | Message.MessageRepliesInfo
        | Message.MessageCommentsInfo
        | null {
        if (this.raw._ !== 'message' || !this.raw.replies) return null

        if (!this._replies) {
            const r = this.raw.replies
            const obj: Message.MessageRepliesInfo = {
                isComments: r.comments as false,
                count: r.replies,
                hasUnread: r.readMaxId !== undefined && r.readMaxId !== r.maxId,
                lastMessageId: r.maxId,
                lastReadMessageId: r.readMaxId,
            }

            if (r.comments) {
                const o = obj as unknown as Message.MessageCommentsInfo
                o.discussion = getMarkedPeerId(r.channelId!, 'channel')
                o.repliers =
                    r.recentRepliers?.map((it) => getMarkedPeerId(it)) ?? []
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
        return this.raw.replyTo?.replyToMsgId ?? null
    }

    /**
     * For replies, ID of the thread (i.e. ID of the top message
     * in the thread)
     */
    get replyToThreadId(): number | null {
        return this.raw.replyTo?.replyToTopId ?? null
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
                this._viaBot = new User(
                    this.client,
                    this._peers.user(this.raw.viaBotId)
                )
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
                    const parsed = MessageEntity._parse(ent)
                    if (parsed) this._entities.push(parsed)
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
    get action(): MessageAction {
        if (!this._action) {
            if (this.raw._ === 'message') {
                this._action = null
            } else {
                this._action = _messageActionFromTl.call(this, this.raw.action)
            }
        }

        return this._action!
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
            if (
                this.raw._ === 'messageService' ||
                !this.raw.media ||
                this.raw.media._ === 'messageMediaEmpty'
            ) {
                this._media = null
            } else {
                this._media = _messageMediaFromTl.call(this, this.raw.media)
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
        return (
            this.raw._ === 'message' &&
            this.raw.media?._ === 'messageMediaDocument' &&
            this.raw.media.nopremium!
        )
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
                    this.client,
                    this.raw.id,
                    getMarkedPeerId(this.raw.peerId),
                    this.raw.reactions,
                    this._peers
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
        if (this.chat.type === 'supergroup' || this.chat.type === 'channel') {
            if (this.chat.username) {
                return `https://t.me/${this.chat.username}/${this.id}`
            } else {
                return `https://t.me/c/${toggleChannelIdMark(this.chat.id)}/${
                    this.id
                }`
            }
        }

        throw new MtArgumentError(
            `Cannot generate message link for ${this.chat.type}`
        )
    }

    /**
     * Get the message text formatted with a given parse mode
     *
     * Shorthand for `client.getParseMode(...).unparse(msg.text, msg.entities)`
     *
     * @param parseMode  Parse mode to use (`null` for default)
     */
    unparse(parseMode?: string | null): string {
        return this.client
            .getParseMode(parseMode)
            .unparse(this.text, this.entities)
    }

    /**
     * For replies, fetch the message that is being replied.
     *
     * Note that even if a message has {@link replyToMessageId},
     * the message itself may have been deleted, in which case
     * this method will also return `null`.
     */
    getReplyTo(): Promise<Message | null> {
        if (!this.replyToMessageId) return Promise.resolve(null)

        if (this.raw.peerId._ === 'peerChannel')
            return this.client.getMessages(this.chat.inputPeer, this.id, true)

        return this.client.getMessagesUnsafe(this.id, true)
    }

    /**
     * Send a message as an answer to this message.
     *
     * This just sends a message to the same chat
     * as this message
     *
     * @param text  Text of the message
     * @param params
     */
    answerText(
        text: string | FormattedString<any>,
        params?: Parameters<TelegramClient['sendText']>[2]
    ): ReturnType<TelegramClient['sendText']> {
        return this.client.sendText(this.chat.inputPeer, text, params)
    }

    /**
     * Send a media as an answer to this message.
     *
     * This just sends a message to the same chat
     * as this message
     *
     * @param media  Media to send
     * @param params
     */
    answerMedia(
        media: InputMediaLike | string,
        params?: Parameters<TelegramClient['sendMedia']>[2]
    ): ReturnType<TelegramClient['sendMedia']> {
        return this.client.sendMedia(this.chat.inputPeer, media, params)
    }

    /**
     * Send a media group as an answer to this message.
     *
     * This just sends a message to the same chat
     * as this message
     *
     * @param medias  Medias to send
     * @param params
     */
    answerMediaGroup(
        medias: (InputMediaLike | string)[],
        params?: Parameters<TelegramClient['sendMediaGroup']>[2]
    ): ReturnType<TelegramClient['sendMediaGroup']> {
        return this.client.sendMediaGroup(this.chat.inputPeer, medias, params)
    }

    /**
     * Send a message in reply to this message.
     *
     * @param text  Text of the message
     * @param params
     */
    replyText(
        text: string | FormattedString<any>,
        params?: Parameters<TelegramClient['sendText']>[2]
    ): ReturnType<TelegramClient['sendText']> {
        if (!params) params = {}
        params.replyTo = this.id

        return this.client.sendText(this.chat.inputPeer, text, params)
    }

    /**
     * Send a media in reply to this message.
     *
     * @param media  Media to send
     * @param params
     */
    replyMedia(
        media: InputMediaLike | string,
        params?: Parameters<TelegramClient['sendMedia']>[2]
    ): ReturnType<TelegramClient['sendMedia']> {
        if (!params) params = {}
        params.replyTo = this.id

        return this.client.sendMedia(this.chat.inputPeer, media, params)
    }

    /**
     * Send a media group in reply to this message.
     *
     * @param medias  Medias to send
     * @param params
     */
    replyMediaGroup(
        medias: (InputMediaLike | string)[],
        params?: Parameters<TelegramClient['sendMediaGroup']>[2]
    ): ReturnType<TelegramClient['sendMediaGroup']> {
        if (!params) params = {}
        params.replyTo = this.id

        return this.client.sendMediaGroup(this.chat.inputPeer, medias, params)
    }

    /**
     * Send a text-only comment to this message.
     *
     * If this is a normal message (not a channel post),
     * a simple reply will be sent.
     *
     * If this post does not have comments section,
     * {@link MtArgumentError} is thrown. To check
     * if a message has comments, use {@link replies}
     *
     * @param text  Text of the message
     * @param params
     */
    commentText(
        text: string | FormattedString<any>,
        params?: Parameters<TelegramClient['sendText']>[2]
    ): ReturnType<TelegramClient['sendText']> {
        if (this.chat.type !== 'channel') {
            return this.replyText(text, params)
        }

        if (!this.replies || !this.replies.isComments) {
            throw new MtArgumentError(
                'This message does not have comments section'
            )
        }

        if (!params) params = {}
        params.commentTo = this.id
        return this.client.sendText(this.chat.inputPeer, text, params)
    }

    /**
     * Send a media comment to this message
     * .
     * If this is a normal message (not a channel post),
     * a simple reply will be sent.
     *
     * If this post does not have comments section,
     * {@link MtArgumentError} is thrown. To check
     * if a message has comments, use {@link replies}
     *
     * @param media  Media to send
     * @param params
     */
    commentMedia(
        media: InputMediaLike | string,
        params?: Parameters<TelegramClient['sendMedia']>[2]
    ): ReturnType<TelegramClient['sendMedia']> {
        if (this.chat.type !== 'channel') {
            return this.replyMedia(media, params)
        }

        if (!this.replies || !this.replies.isComments) {
            throw new MtArgumentError(
                'This message does not have comments section'
            )
        }
        if (!params) params = {}
        params.commentTo = this.id
        return this.client.sendMedia(this.chat.inputPeer, media, params)
    }

    /**
     * Send a media group comment to this message
     * .
     * If this is a normal message (not a channel post),
     * a simple reply will be sent.
     *
     * If this post does not have comments section,
     * {@link MtArgumentError} is thrown. To check
     * if a message has comments, use {@link replies}
     *
     * @param medias  Medias to send
     * @param params
     */
    commentMediaGroup(
        medias: (InputMediaLike | string)[],
        params?: Parameters<TelegramClient['sendMediaGroup']>[2]
    ): ReturnType<TelegramClient['sendMediaGroup']> {
        if (this.chat.type !== 'channel') {
            return this.replyMediaGroup(medias, params)
        }

        if (!this.replies || !this.replies.isComments) {
            throw new MtArgumentError(
                'This message does not have comments section'
            )
        }
        if (!params) params = {}
        params.commentTo = this.id
        return this.client.sendMediaGroup(this.chat.inputPeer, medias, params)
    }

    /**
     * Delete this message.
     *
     * @param revoke  Whether to "revoke" (i.e. delete for both sides). Only used for chats and private chats.
     */
    delete(revoke = false): Promise<void> {
        return this.client.deleteMessages(this.chat.inputPeer, this.id, revoke)
    }

    /**
     * Pin this message.
     *
     * @param notify  Whether to send a notification (only for legacy groups and supergroups)
     * @param bothSides  Whether to pin for both sides (only for private chats)
     */
    pin(notify = false, bothSides = false): Promise<void> {
        return this.client.pinMessage(
            this.chat.inputPeer,
            this.id,
            notify,
            bothSides
        )
    }

    /**
     * Unpin this message.
     */
    unpin(): Promise<void> {
        return this.client.pinMessage(this.chat.inputPeer, this.id)
    }

    /**
     * Edit this message's text and/or reply markup
     *
     * @link TelegramClient.editMessage
     */
    edit(
        params: Parameters<TelegramClient['editMessage']>[2]
    ): Promise<Message> {
        return this.client.editMessage(this.chat.inputPeer, this.id, params)
    }

    /**
     * Edit message text and optionally reply markup.
     *
     * Convenience method that just wraps {@link edit},
     * passing positional `text` as object field.
     *
     * @param text  New message text
     * @param params?  Additional parameters
     * @link TelegramClient.editMessage
     */
    editText(
        text: string | FormattedString<any>,
        params?: Omit<Parameters<TelegramClient['editMessage']>[2], 'text'>
    ): Promise<Message> {
        return this.edit({
            text,
            ...(params || {}),
        })
    }

    /**
     * Forward this message to some chat
     *
     * @param peer  Chat where to forward this message
     * @param params
     * @returns  Forwarded message
     */
    forwardTo(
        peer: InputPeerLike,
        params?: Parameters<TelegramClient['forwardMessages']>[3]
    ): Promise<Message> {
        return this.client.forwardMessages(
            peer,
            this.chat.inputPeer,
            this.id,
            params
        )
    }

    /**
     * Send this message as a copy (i.e. send the same message,
     * but do not forward it).
     *
     * Note that if the message contains a webpage,
     * it will be copied simply as a text message,
     * and if the message contains an invoice,
     * it can't be copied.
     *
     * @param toChatId  Target chat ID
     * @param params  Copy parameters
     */
    sendCopy(
        toChatId: InputPeerLike,
        params?: Parameters<TelegramClient['sendCopy']>[3]
    ): Promise<Message> {
        if (!params) params = {}

        if (this.raw._ === 'messageService') {
            throw new MtArgumentError("Service messages can't be copied")
        }

        if (this.media && !(this.media instanceof WebPage)) {
            return this.client.sendMedia(
                toChatId,
                {
                    type: 'auto',
                    file: this.media.inputMedia,
                    caption: params.caption ?? this.raw.message,
                    // we shouldn't use original entities if the user wants custom text
                    entities:
                        params.entities ?? params.caption
                            ? undefined
                            : this.raw.entities,
                },
                params
            )
        }

        return this.client.sendText(toChatId, this.raw.message, params)
    }

    /**
     * Get all messages inside a group that this
     * message belongs to (see {@link groupedId}),
     * including this message.
     *
     * In case this message is not inside of a group,
     * will just return itself.
     */
    async getGroup(): Promise<Message[]> {
        if (!this.groupedId) return [this]

        return this.client.getMessageGroup(this.chat.inputPeer, this.raw.id)
    }

    /**
     * Get discussion message for some channel post.
     *
     * Returns `null` if the post does not have a discussion
     * message.
     */
    async getDiscussionMessage(): Promise<Message | null> {
        return this.client.getDiscussionMessage(
            this.chat.inputPeer,
            this.raw.id
        )
    }

    /**
     * Read history in the chat up until this message
     *
     * @param clearMentions  Whether to also clear mentions
     */
    async read(clearMentions = false): Promise<void> {
        return this.client.readHistory(
            this.chat.inputPeer,
            this.raw.id,
            clearMentions
        )
    }

    /**
     * React to this message
     *
     * @param emoji  Reaction emoji
     * @param big  Whether to use a big reaction
     */
    async react(emoji: string | null, big?: boolean): Promise<Message> {
        return this.client.sendReaction(
            this.chat.inputPeer,
            this.raw.id,
            emoji,
            big
        )
    }

    async getCustomEmojis(): Promise<Sticker[]> {
        if (this.raw._ === 'messageService' || !this.raw.entities) return []

        return this.client.getCustomEmojis(
            this.raw.entities
                .filter((it) => it._ === 'messageEntityCustomEmoji')
                .map((it) => (it as tl.RawMessageEntityCustomEmoji).documentId)
        )
    }
}

makeInspectable(Message, ['isScheduled'], ['link'])
