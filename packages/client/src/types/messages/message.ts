import { User, Chat, InputPeerLike, UsersIndex, ChatsIndex } from '../peers'
import { tl } from '@mtcute/tl'
import { BotKeyboard, ReplyMarkup } from '../bots'
import { MAX_CHANNEL_ID } from '@mtcute/core'
import {
    MtCuteArgumentError,
    MtCuteEmptyError,
    MtCuteTypeAssertionError,
} from '../errors'
import { TelegramClient } from '../../client'
import { MessageEntity } from './message-entity'
import { makeInspectable } from '../utils'
import { InputMediaLike, WebPage } from '../media'
import { _messageActionFromTl, MessageAction } from './message-action'
import { _messageMediaFromTl, MessageMedia } from './message-media'

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
}

/**
 * A Telegram message.
 */
export class Message {
    /** Telegram client that received this message */
    readonly client: TelegramClient

    /**
     * Raw TL object.
     *
     * > **Note**: In fact, `raw` can also be {@link tl.RawMessageEmpty}.
     * > But since it is quite rare, for the simplicity sake
     * > we don't bother thinking about it (and you shouldn't too).
     * >
     * > When the {@link Message} is in fact `messageEmpty`,
     * > `.empty` will be true and trying to access properties
     * > that are not available will result in {@link MtCuteEmptyError}.
     * >
     * > The only property that is available on an "empty" message is `.id`
     */
    readonly raw: tl.RawMessage | tl.RawMessageService

    /** Map of users in this message. Mainly for internal use */
    readonly _users: UsersIndex
    /** Map of chats in this message. Mainly for internal use */
    readonly _chats: ChatsIndex

    private _emptyError?: MtCuteEmptyError

    constructor(
        client: TelegramClient,
        raw: tl.TypeMessage,
        users: UsersIndex,
        chats: ChatsIndex,
        isScheduled = false
    ) {
        this.client = client
        this._users = users
        this._chats = chats

        // a bit of cheating in terms of types but whatever :shrug:
        //
        // using exclude instead of `typeof this.raw` because
        // TypeMessage might have some other types added, and we'll detect
        // that at compile time
        this.raw = raw as Exclude<tl.TypeMessage, tl.RawMessageEmpty>
        this.empty = raw._ === 'messageEmpty'

        if (this.empty) {
            this._emptyError = new MtCuteEmptyError()
        }
        this.isScheduled = isScheduled
    }

    /**
     * Whether the message is empty.
     *
     * Note that if the message is empty,
     * accessing any other property except `id` and `raw`
     * will result in {@link MtCuteEmptyError}
     */
    readonly empty: boolean

    /**
     * Whether the message is scheduled.
     * If it is, then its {@link date} is set to future.
     */
    readonly isScheduled: boolean

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
        if (this._emptyError) throw this._emptyError

        return this.raw._ === 'message' ? this.raw.views ?? null : null
    }

    /**
     * Whether the message is incoming or outgoing:
     *  - Messages received from other chats are incoming (`outgoing = false`)
     *  - Messages sent by you to other chats are outgoing (`outgoing = true`)
     *  - Messages to yourself (i.e. *Saved Messages*) are incoming (`outgoing = false`)
     */
    get isOutgoing(): boolean {
        if (this._emptyError) throw this._emptyError

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
        if (this._emptyError) throw this._emptyError

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
        if (this._emptyError) throw this._emptyError

        if (this._sender === undefined) {
            const from = this.raw.fromId
            if (!from) {
                // anon admin, return the chat
                this._sender = this.chat
            } else
                switch (from._) {
                    case 'peerChannel': // forwarded channel post
                        this._sender = new Chat(
                            this.client,
                            this._chats[from.channelId]
                        )
                        break
                    case 'peerUser':
                        this._sender = new User(
                            this.client,
                            this._users[from.userId]
                        )
                        break
                    default:
                        throw new MtCuteTypeAssertionError(
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
        if (this._emptyError) throw this._emptyError

        if (this._chat === undefined) {
            this._chat = Chat._parseFromMessage(
                this.client,
                this.raw,
                this._users,
                this._chats
            )
        }

        return this._chat
    }

    /**
     * Date the message was sent
     */
    get date(): Date {
        if (this._emptyError) throw this._emptyError

        return new Date(this.raw.date * 1000)
    }

    private _forward?: Message.MessageForwardInfo | null

    /**
     * If this message is a forward, contains info about it.
     */
    get forward(): Message.MessageForwardInfo | null {
        if (this._emptyError) throw this._emptyError

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
                                this._chats[fwd.fromId.channelId]
                            )
                            break
                        case 'peerUser':
                            sender = new User(
                                this.client,
                                this._users[fwd.fromId.userId]
                            )
                            break
                        default:
                            throw new MtCuteTypeAssertionError(
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

    /**
     * For replies, the ID of the message that current message
     * replies to.
     */
    get replyToMessageId(): number | null {
        if (this._emptyError) throw this._emptyError

        return this.raw.replyTo?.replyToMsgId ?? null
    }

    /**
     * Whether this message contains mention of the current user
     */
    get isMention(): boolean {
        if (this._emptyError) throw this._emptyError

        return this.raw.mentioned!
    }

    private _viaBot: User | null
    /**
     * If this message is generated from an inline query,
     * information about the bot which generated it
     */
    get viaBot(): User | null {
        if (this._emptyError) throw this._emptyError

        if (this._viaBot === undefined) {
            if (this.raw._ === 'messageService' || !this.raw.viaBotId) {
                this._viaBot = null
            } else {
                this._viaBot = new User(
                    this.client,
                    this._users[this.raw.viaBotId]
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
        if (this._emptyError) throw this._emptyError

        return this.raw._ === 'messageService' ? '' : this.raw.message
    }

    private _entities?: MessageEntity[]
    /**
     * Message text/caption entities (may be empty)
     */
    get entities(): ReadonlyArray<MessageEntity> {
        if (this._emptyError) throw this._emptyError

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
                        markup = null
                        break
                }

                this._markup = markup
            }
        }

        return this._markup
    }

    /**
     * Generated permalink to this message, only for groups and channels
     *
     * @throws MtCuteArgumentError  In case the chat does not support message links
     */
    get link(): string {
        if (this.chat.type === 'supergroup' || this.chat.type === 'channel') {
            if (this.chat.username) {
                return `https://t.me/${this.chat.username}/${this.id}`
            } else {
                return `https://t.me/c/${MAX_CHANNEL_ID - this.chat.id}/${
                    this.id
                }`
            }
        }

        throw new MtCuteArgumentError(
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
     * @throws MtCuteArgumentError  In case the message is not a reply
     */
    getReplyTo(): Promise<Message> {
        if (!this.replyToMessageId)
            throw new MtCuteArgumentError('This message is not a reply!')

        return this.client.getMessages(this.chat.inputPeer, this.id, true)
    }

    /**
     * Send a message in reply to this message.
     *
     * By default just sends a message to the same chat,
     * to make the reply a "real" reply, pass `visible=true`
     *
     * @param text  Text of the message
     * @param visible  Whether the reply should be visible
     * @param params
     */
    replyText(
        text: string,
        visible = false,
        params?: Parameters<TelegramClient['sendText']>[2]
    ): ReturnType<TelegramClient['sendText']> {
        if (visible) {
            return this.client.sendText(this.chat.inputPeer, text, {
                ...(params || {}),
                replyTo: this.id,
            })
        }
        return this.client.sendText(this.chat.inputPeer, text, params)
    }

    /**
     * Send a media in reply to this message.
     *
     * By default just sends a message to the same chat,
     * to make the reply a "real" reply, pass `visible=true`
     *
     * @param media  Media to send
     * @param visible  Whether the reply should be visible
     * @param params
     */
    replyMedia(
        media: InputMediaLike,
        visible = false,
        params?: Parameters<TelegramClient['sendMedia']>[2]
    ): ReturnType<TelegramClient['sendMedia']> {
        if (visible) {
            return this.client.sendMedia(this.chat.inputPeer, media, {
                ...(params || {}),
                replyTo: this.id,
            })
        }
        return this.client.sendMedia(this.chat.inputPeer, media, params)
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
     * @param params  Additional parameters
     * @link TelegramClient.editMessage
     */
    editText(
        text: string,
        params?: Omit<Parameters<TelegramClient['editMessage']>[2], 'text'>
    ): Promise<Message> {
        return this.edit({
            text,
            ...(params || {}),
        })
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
        params: Parameters<TelegramClient['sendCopy']>[3]
    ): Promise<Message> {
        if (!params) params = {}

        if (this.raw._ === 'messageService') {
            throw new MtCuteArgumentError("Service messages can't be copied")
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
}

makeInspectable(Message, ['empty', 'isScheduled'], ['link'])
