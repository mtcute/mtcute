import { getMarkedPeerId, tl } from '@mtcute/core'

import { assertTypeIsNot, hasValueAtKey, makeInspectable } from '../../utils'
import { MtMessageNotFoundError } from '../errors'
import { Chat } from '../peers/chat'
import { PeersIndex } from '../peers/peers-index'
import { DraftMessage } from './draft-message'
import { Message } from './message'

/**
 * Type used as an input for a folder in client methods
 *
 * You can pass folder object, id or title
 */
export type InputDialogFolder = string | number | tl.RawDialogFilter

/**
 * A dialog.
 *
 * Think of it as something that is listed
 * in Telegram's main window.
 */
export class Dialog {
    constructor(
        readonly raw: tl.RawDialog,
        readonly _peers: PeersIndex,
        readonly _messages: Map<number, tl.TypeMessage>,
    ) {}

    /**
     * Parse a list of dialogs from a TL object
     *
     * @param client  Client instance
     * @param dialogs  TL object
     * @param limit  Maximum number of dialogs to parse
     */
    static parseTlDialogs(dialogs: tl.messages.TypeDialogs | tl.messages.TypePeerDialogs, limit?: number): Dialog[] {
        assertTypeIsNot('parseDialogs', dialogs, 'messages.dialogsNotModified')

        const peers = PeersIndex.from(dialogs)

        const messages = new Map<number, tl.TypeMessage>()
        dialogs.messages.forEach((msg) => {
            if (!msg.peerId) return

            messages.set(getMarkedPeerId(msg.peerId), msg)
        })

        const arr = dialogs.dialogs.filter(hasValueAtKey('_', 'dialog')).map((it) => new Dialog(it, peers, messages))

        if (limit) {
            return arr.slice(0, limit)
        }

        return arr
    }

    /**
     * Find pinned dialogs from a list of dialogs
     *
     * @param dialogs  Dialogs list
     * @param folder  If passed, status of pin will be checked against this folder, and not globally
     */
    static findPinned(dialogs: Dialog[], folder?: tl.RawDialogFilter): Dialog[] {
        if (folder) {
            const index: Record<number, true> = {}
            folder.pinnedPeers.forEach((peer) => {
                index[getMarkedPeerId(peer)] = true
            })

            return dialogs.filter((i) => index[i.chat.id])
        }

        return dialogs.filter((i) => i.isPinned)
    }

    /**
     * Create a filter predicate for the given Folder.
     * Returned predicate can be used in `Array.filter()`
     *
     * @param folder  Folder to filter for
     * @param excludePinned  Whether to exclude pinned folders
     */
    static filterFolder(folder: tl.TypeDialogFilter, excludePinned = true): (val: Dialog) => boolean {
        if (folder._ === 'dialogFilterDefault') {
            return () => true
        }

        const pinned: Record<number, true> = {}
        const include: Record<number, true> = {}
        const exclude: Record<number, true> = {}

        // populate indices
        if (excludePinned) {
            folder.pinnedPeers.forEach((peer) => {
                pinned[getMarkedPeerId(peer)] = true
            })
        }
        folder.includePeers.forEach((peer) => {
            include[getMarkedPeerId(peer)] = true
        })

        if (folder._ === 'dialogFilterChatlist') {
            return (dialog) => {
                const chatId = dialog.chat.id

                if (excludePinned && pinned[chatId]) return false

                return include[chatId] || pinned[chatId]
            }
        }

        folder.excludePeers.forEach((peer) => {
            exclude[getMarkedPeerId(peer)] = true
        })

        return (dialog) => {
            const chat = dialog.chat
            const chatId = dialog.chat.id
            const chatType = dialog.chat.chatType

            // manual exclusion/inclusion and pins
            if (include[chatId]) return true

            if (exclude[chatId] || (excludePinned && pinned[chatId])) {
                return false
            }

            // exclusions based on status
            if (folder.excludeRead && !dialog.isUnread) return false
            if (folder.excludeMuted && dialog.isMuted) return false
            // even though this was handled in getDialogs, this method
            // could be used outside of it, so check again
            if (folder.excludeArchived && dialog.isArchived) return false

            // inclusions based on chat type
            if (folder.contacts && chatType === 'private' && chat.isContact) {
                return true
            }
            if (folder.nonContacts && chatType === 'private' && !chat.isContact) {
                return true
            }
            if (folder.groups && (chatType === 'group' || chatType === 'supergroup')) {
                return true
            }
            if (folder.broadcasts && chatType === 'channel') return true
            if (folder.bots && chatType === 'bot') return true

            return false
        }
    }

    /**
     * Whether this dialog is pinned
     */
    get isPinned(): boolean {
        return this.raw.pinned!
    }

    /**
     * Whether this chat was manually marked as unread
     */
    get isManuallyUnread(): boolean {
        return this.raw.unreadMark!
    }

    /**
     * Whether this chat should be considered unread
     * (i.e. has more than 1 unread message, or has
     * a "manually unread" mark)
     */
    get isUnread(): boolean {
        return this.raw.unreadMark || this.raw.unreadCount > 1
    }

    /**
     * Whether this dialog is muted
     */
    get isMuted(): boolean {
        return this.raw.notifySettings.silent!
    }

    /**
     * Whether this dialog is archived
     */
    get isArchived(): boolean {
        return this.raw.folderId === 1
    }

    private _chat?: Chat
    /**
     * Chat that this dialog represents
     */
    get chat(): Chat {
        if (!this._chat) {
            const peer = this.raw.peer

            let chat

            switch (peer._) {
                case 'peerChannel':
                case 'peerChat':
                    chat = this._peers.chat(peer._ === 'peerChannel' ? peer.channelId : peer.chatId)
                    break
                default:
                    chat = this._peers.user(peer.userId)
                    break
            }

            this._chat = new Chat(chat)
        }

        return this._chat
    }

    private _lastMessage?: Message
    /**
     * The latest message sent in this chat
     */
    get lastMessage(): Message {
        if (!this._lastMessage) {
            const cid = this.chat.id

            if (this._messages.has(cid)) {
                this._lastMessage = new Message(this._messages.get(cid)!, this._peers)
            } else {
                throw new MtMessageNotFoundError(cid, 0)
            }
        }

        return this._lastMessage
    }

    /**
     * ID of the last read outgoing message in this dialog
     */
    get lastReadOutgoing(): number {
        return this.raw.readOutboxMaxId
    }

    /**
     * ID of the last read ingoing message in this dialog
     */
    get lastReadIngoing(): number {
        return this.raw.readInboxMaxId
    }

    /**
     * ID of the last read message in this dialog
     */
    get lastRead(): number {
        return Math.max(this.raw.readOutboxMaxId, this.raw.readInboxMaxId)
    }

    /**
     * Number of unread messages
     */
    get unreadCount(): number {
        return this.raw.unreadCount
    }

    /**
     * Number of unread mentions
     */
    get unreadMentionsCount(): number {
        return this.raw.unreadMentionsCount
    }

    /**
     * Number of unread reactions
     */
    get unreadReactionsCount(): number {
        return this.raw.unreadReactionsCount
    }

    private _draftMessage?: DraftMessage | null
    /**
     * Draft message in this dialog
     */
    get draftMessage(): DraftMessage | null {
        if (this._draftMessage === undefined) {
            if (this.raw.draft?._ === 'draftMessage') {
                this._draftMessage = new DraftMessage(this.raw.draft)
            } else {
                this._draftMessage = null
            }
        }

        return this._draftMessage
    }

    /**
     * TTL period of all messages in this dialog
     */
    get ttlPeriod(): number | null {
        return this.raw.ttlPeriod ?? null
    }
}

makeInspectable(Dialog)
