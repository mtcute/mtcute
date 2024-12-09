import type { tl } from '@mtcute/tl'

import type { Peer } from '../peers/peer.js'
import { getMarkedPeerId } from '../../../utils/peer-utils.js'
import { assertTypeIsNot, hasValueAtKey } from '../../../utils/type-assertions.js'
import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'

import { parsePeer } from '../peers/peer.js'
import { PeersIndex } from '../peers/peers-index.js'
import { DraftMessage } from './draft-message.js'
import { Message } from './message.js'

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

        const arr = dialogs.dialogs.filter(hasValueAtKey('_', 'dialog')).map(it => new Dialog(it, peers, messages))

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

            return dialogs.filter(i => index[i.peer.id])
        }

        return dialogs.filter(i => i.isPinned)
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
                const peerId = dialog.peer.id

                if (excludePinned && pinned[peerId]) return false

                return include[peerId] || pinned[peerId]
            }
        }

        folder.excludePeers.forEach((peer) => {
            exclude[getMarkedPeerId(peer)] = true
        })

        return (dialog) => {
            const peer = dialog.peer
            const peerId = dialog.peer.id

            // manual exclusion/inclusion and pins
            if (include[peerId]) return true

            if (exclude[peerId] || (excludePinned && pinned[peerId])) {
                return false
            }

            // exclusions based on status
            if (folder.excludeRead && !dialog.isUnread) return false
            if (folder.excludeMuted && dialog.isMuted) return false
            // even though this was handled in getDialogs, this method
            // could be used outside of it, so check again
            if (folder.excludeArchived && dialog.isArchived) return false

            // inclusions based on chat type
            if (folder.contacts && peer.type === 'user' && peer.isContact) {
                return true
            }
            if (folder.nonContacts && peer.type === 'user' && !peer.isContact) {
                return true
            }
            if (folder.groups && peer.type === 'chat' && peer.isGroup) {
                return true
            }
            if (folder.broadcasts && peer.type === 'chat' && peer.chatType === 'channel') return true
            if (folder.bots && peer.type === 'user' && peer.isBot) return true

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
     * Whether this dialog is muted.
     *
     * If `null`, the default account-level setting should be used.
     */
    get isMuted(): boolean | null {
        return this.raw.notifySettings.silent ?? null
    }

    /**
     * Whether this dialog is archived
     */
    get isArchived(): boolean {
        return this.raw.folderId === 1
    }

    /**
     * Peer that this dialog represents
     */
    get peer(): Peer {
        return parsePeer(this.raw.peer, this._peers)
    }

    /**
     * The latest message sent in this chat (if any)
     */
    get lastMessage(): Message | null {
        const cid = this.peer.id

        if (this._messages.has(cid)) {
            return new Message(this._messages.get(cid)!, this._peers)
        }

        return null
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

    /**
     * Draft message in this dialog
     */
    get draftMessage(): DraftMessage | null {
        if (this.raw.draft?._ === 'draftMessage') {
            return new DraftMessage(this.raw.draft)
        }

        return null
    }

    /**
     * TTL period of all messages in this dialog
     */
    get ttlPeriod(): number | null {
        return this.raw.ttlPeriod ?? null
    }
}

memoizeGetters(Dialog, ['peer', 'lastMessage', 'draftMessage'])
makeInspectable(Dialog)
