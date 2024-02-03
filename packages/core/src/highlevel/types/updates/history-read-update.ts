import { tl } from '@mtcute/tl'

import { getMarkedPeerId, toggleChannelIdMark } from '../../../utils/peer-utils.js'
import { makeInspectable } from '../../utils/index.js'

export class HistoryReadUpdate {
    constructor(
        readonly raw:
            | tl.RawUpdateReadHistoryInbox
            | tl.RawUpdateReadHistoryOutbox
            | tl.RawUpdateReadChannelInbox
            | tl.RawUpdateReadChannelOutbox
            | tl.RawUpdateReadChannelDiscussionInbox
            | tl.RawUpdateReadChannelDiscussionOutbox,
    ) {}

    /**
     * Whether this update is about an "outbox" read
     * (i.e. a message you have sent earlier was read)
     */
    get isOutbox(): boolean {
        switch (this.raw._) {
            case 'updateReadChannelDiscussionOutbox':
            case 'updateReadHistoryOutbox':
            case 'updateReadChannelOutbox':
                return true
            default:
                return false
        }
    }

    /**
     * Whether this update is about messages in a thread
     * (e.g. a comments thread or a topic in a forum)
     */
    get isDiscussion(): boolean {
        switch (this.raw._) {
            case 'updateReadChannelDiscussionOutbox':
            case 'updateReadChannelDiscussionInbox':
                return true
            default:
                return false
        }
    }

    /**
     * Marked peer ID of the chat where the messages were read.
     */
    get chatId(): number {
        switch (this.raw._) {
            case 'updateReadHistoryOutbox':
            case 'updateReadHistoryInbox':
                return getMarkedPeerId(this.raw.peer)
            case 'updateReadChannelOutbox':
            case 'updateReadChannelInbox':
            case 'updateReadChannelDiscussionOutbox':
            case 'updateReadChannelDiscussionInbox':
                return toggleChannelIdMark(this.raw.channelId)
        }
    }

    /**
     * For inbox updates (i.e. `isOutbox = false`),
     * number of messages that are still unread in the chat.
     *
     * For other updates, `0`
     */
    get unreadCount(): number {
        switch (this.raw._) {
            case 'updateReadHistoryInbox':
            case 'updateReadChannelInbox':
                return this.raw.stillUnreadCount
            // `updateReadChannelDiscussionInbox` does not contain that data for some reason
            case 'updateReadChannelDiscussionInbox':
            case 'updateReadHistoryOutbox':
            case 'updateReadChannelOutbox':
            case 'updateReadChannelDiscussionOutbox':
                return 0
        }
    }

    /**
     * ID of the last read message.
     *
     * Note that if `isDiscussion == true`, this contains the ID of the
     * last read message inside that thread, and not in the group itself.
     */
    get maxReadId(): number {
        switch (this.raw._) {
            case 'updateReadHistoryOutbox':
            case 'updateReadHistoryInbox':
            case 'updateReadChannelOutbox':
            case 'updateReadChannelInbox':
                return this.raw.maxId
            case 'updateReadChannelDiscussionOutbox':
            case 'updateReadChannelDiscussionInbox':
                return this.raw.readMaxId
        }
    }

    /**
     * ID of the thread/topic (i.e. ID of the top message).
     *
     * For non-thread updates, 0.
     */
    get threadId(): number {
        switch (this.raw._) {
            case 'updateReadHistoryOutbox':
            case 'updateReadHistoryInbox':
            case 'updateReadChannelOutbox':
            case 'updateReadChannelInbox':
                return 0
            case 'updateReadChannelDiscussionOutbox':
            case 'updateReadChannelDiscussionInbox':
                return this.raw.topMsgId
        }
    }
}

makeInspectable(HistoryReadUpdate)
