import { TelegramClient } from '../../client'
import { tl } from '@mtcute/tl'
import { Chat } from '../peers'
import { Message } from './message'
import { DraftMessage } from './draft-message'
import { makeInspectable } from '../utils'

/**
 * A dialog.
 *
 * Think of it as something that is listed
 * in Telegram's main window.
 */
export class Dialog {
    readonly client: TelegramClient
    readonly raw: tl.RawDialog

    /** Map of users in this object. Mainly for internal use */
    readonly _users: Record<number, tl.TypeUser>

    /** Map of chats in this object. Mainly for internal use */
    readonly _chats: Record<number, tl.TypeChat>

    /** Map of messages in this object. Mainly for internal use */
    readonly _messages: Record<number, tl.TypeMessage>

    constructor(
        client: TelegramClient,
        raw: tl.RawDialog,
        users: Record<number, tl.TypeUser>,
        chats: Record<number, tl.TypeChat>,
        messages: Record<number, tl.TypeMessage>
    ) {
        this.client = client
        this.raw = raw
        this._users = users
        this._chats = chats
        this._messages = messages
    }

    /**
     * Whether this dialog is pinned
     */
    get isPinned(): boolean {
        return !!this.raw.pinned
    }

    /**
     * Whether this chat was manually marked as unread
     */
    get isManuallyUnread(): boolean {
        return !!this.raw.unreadMark
    }

    /**
     * Whether this chat should be considered unread
     * (i.e. has more than 1 unread message, or has
     * a "manually unread" mark)
     */
    get isUnread(): boolean {
        return this.raw.unreadMark || this.raw.unreadCount > 1
    }

    private _chat?: Chat
    /**
     * Chat that this dialog represents
     */
    get chat(): Chat {
        if (!this._chat) {
            const peer = this.raw.peer

            let chat
            if (peer._ === 'peerChannel' || peer._ === 'peerChat') {
                chat = this._chats[peer._ === 'peerChannel' ? peer.channelId : peer.chatId]
            } else {
                chat = this._users[peer.userId]
            }

            this._chat = new Chat(this.client, chat)
        }

        return this._chat
    }

    private _lastMessage?: Message | null
    /**
     * The latest message sent in this chat
     */
    get lastMessage(): Message | null {
        if (this._lastMessage === undefined) {
            const cid = this.chat.id
            if (cid in this._messages) {
                this._lastMessage = new Message(this.client, this._messages[cid], this._users, this._chats)
            } else {
                this._lastMessage = null
            }
        }

        return this._lastMessage
    }

    /**
     * Number of unread messages
     */
    get unreadCount(): number {
        return this.raw.unreadCount
    }

    /**
     * Number of unread messages
     */
    get unreadMentionsCount(): number {
        return this.raw.unreadMentionsCount
    }

    private _draftMessage?: DraftMessage | null
    /**
     * Draft message in this dialog
     */
    get draftMessage(): DraftMessage | null {
        if (this._draftMessage === undefined) {
            if (this.raw.draft?._ === 'draftMessage') {
                this._draftMessage = new DraftMessage(this.client, this.raw.draft, this.chat.inputPeer)
            } else {
                this._draftMessage = null
            }
        }

        return this._draftMessage
    }
}

makeInspectable(Dialog)
