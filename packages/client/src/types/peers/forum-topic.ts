import { MtTypeAssertionError, tl } from '@mtcute/core'

import { TelegramClient } from '../../client'
import { hasValueAtKey, makeInspectable } from '../../utils'
import { MtMessageNotFoundError } from '../errors'
import { DraftMessage, Message } from '../messages'
import { Chat } from './chat'
import { PeersIndex } from './peers-index'
import { User } from './user'

export class ForumTopic {
    static COLOR_BLUE = 0x6fb9f0
    static COLOR_YELLOW = 0xffd67e
    static COLOR_PURPLE = 0xcb86db
    static COLOR_GREEN = 0x8eee98
    static COLOR_PINK = 0xff93b2
    static COLOR_RED = 0xfb6f5f

    constructor(
        readonly client: TelegramClient,
        readonly raw: tl.RawForumTopic,
        readonly _peers: PeersIndex,
        readonly _messages?: Map<number, tl.TypeMessage>,
    ) {}

    static parseTlForumTopics(client: TelegramClient, topics: tl.messages.TypeForumTopics): ForumTopic[] {
        const peers = PeersIndex.from(topics)
        const messages = new Map<number, tl.TypeMessage>()

        topics.messages.forEach((msg) => {
            if (!msg.peerId) return

            messages.set(msg.id, msg)
        })

        return topics.topics
            .filter(hasValueAtKey('_', 'forumTopic'))
            .map((it) => new ForumTopic(client, it, peers, messages))
    }

    /**
     * Whether the topic was created by the current user
     */
    get isMy(): boolean {
        return this.raw.my!
    }

    /**
     * Whether the topic is closed
     */
    get isClosed(): boolean {
        return this.raw.closed!
    }

    /**
     * Whether the topic is pinned
     */
    get isPinned(): boolean {
        return this.raw.pinned!
    }

    /**
     * Whether this constructor is a reduced version of the full topic information.
     *
     * If `true`, only {@link isMy}, {@link isClosed}, {@link id}, {@link date},
     * {@link title}, {@link iconColor}, {@link iconCustomEmoji} and {@link creator}
     * parameters will contain valid information.
     */
    get isShort(): boolean {
        return this.raw.short!
    }

    /**
     * ID of the topic
     */
    get id(): number {
        return this.raw.id
    }

    /**
     * Date when the topic was created
     */
    get date(): Date {
        return new Date(this.raw.date * 1000)
    }

    /**
     * Title of the topic
     */
    get title(): string {
        return this.raw.title
    }

    /**
     * Color of the topic's icon, used as a fallback
     * in case {@link iconEmoji} is not set.
     *
     * One of the static `COLOR_*` fields.
     */
    get iconColor(): number | null {
        return this.raw.iconColor ?? null
    }

    /**
     * Emoji used as the topic's icon.
     */
    get iconCustomEmoji(): tl.Long | null {
        return this.raw.iconEmojiId ?? null
    }

    private _creator?: User | Chat
    /**
     * Creator of the topic
     */
    get creator(): User | Chat {
        if (this._creator) return this._creator

        switch (this.raw.fromId._) {
            case 'peerUser':
                return (this._creator = new User(this.client, this._peers.user(this.raw.fromId.userId)))
            case 'peerChat':
                return (this._creator = new Chat(this.client, this._peers.chat(this.raw.fromId.chatId)))
            default:
                throw new MtTypeAssertionError('ForumTopic#creator', 'peerUser | peerChat', this.raw.fromId._)
        }
    }

    private _lastMessage?: Message
    /**
     * The latest message sent in this topic
     */
    get lastMessage(): Message {
        if (!this._lastMessage) {
            const id = this.raw.topMessage

            if (this._messages?.has(id)) {
                this._lastMessage = new Message(this.client, this._messages.get(id)!, this._peers)
            } else {
                throw new MtMessageNotFoundError(0, id)
            }
        }

        return this._lastMessage
    }

    /**
     * ID of the last read outgoing message in this topic
     */
    get lastReadIngoing(): number {
        return this.raw.readInboxMaxId
    }

    /**
     * ID of the last read ingoing message in this topic
     */
    get lastReadOutgoing(): number {
        return this.raw.readOutboxMaxId
    }

    /**
     * ID of the last read message in this topic
     */
    get lastRead(): number {
        return Math.max(this.raw.readOutboxMaxId, this.raw.readInboxMaxId)
    }

    /**
     * Number of unread messages in the topic
     */
    get unreadCount(): number {
        return this.raw.unreadCount
    }

    /**
     * Number of unread mentions in the topic
     */
    get unreadMentionsCount(): number {
        return this.raw.unreadMentionsCount
    }

    /**
     * Number of unread reactions in the topic
     */
    get unreadReactionsCount(): number {
        return this.raw.unreadReactionsCount
    }

    private _draftMessage?: DraftMessage

    /**
     * Draft message in the topic
     */
    get draftMessage(): DraftMessage | null {
        if (this._draftMessage) return this._draftMessage

        if (!this.raw.draft || this.raw.draft._ === 'draftMessageEmpty') return null

        return (this._draftMessage = new DraftMessage(this.client, this.raw.draft))
    }
}

makeInspectable(ForumTopic)
