import { getBarePeerId, tl } from '@mtcute/core'

import { makeInspectable } from '../../utils'
import { PeersIndex, User } from '../peers'

/**
 * This update is sent when a user requests to join a chat
 * via invite link with approvals.
 *
 * > **NOTE**: This update is only received by users,
 * > if you are using a bot, see {@link BotChatJoinRequestUpdate}
 */
export class ChatJoinRequestUpdate {
    constructor(
        readonly raw: tl.RawUpdatePendingJoinRequests,
        readonly _peers: PeersIndex,
    ) {}

    // in this update, peers index only contains
    // recent requesters, not the chat

    /**
     * ID of the chat/channel
     */
    get chatId(): number {
        return getBarePeerId(this.raw.peer)
    }

    /**
     * IDs of the users who recently requested to join the chat
     */
    get recentRequestersIds(): number[] {
        return this.raw.recentRequesters
    }

    private _recentRequesters?: User[]
    /**
     * Users who recently requested to join the chat
     */
    get recentRequesters(): User[] {
        return (this._recentRequesters ??= this.raw.recentRequesters.map((id) => new User(this._peers.user(id))))
    }

    /**
     * Total number of pending requests
     */
    get totalPending(): number {
        return this.raw.requestsPending
    }

    /**
     * Approve or deny the last requested user
     */
    // hideLast(action: Parameters<TelegramClient['hideJoinRequest']>[1]['action']): Promise<void> {
    // return this.client.hideJoinRequest(this.chatId, { user: this.raw.recentRequesters[0], action })
    // }

    /**
     * Approve or deny all recent requests
     * (the ones available in {@link recentRequesters})
     */
    // async hideAllRecent(action: Parameters<TelegramClient['hideJoinRequest']>[1]['action']): Promise<void> {
    //     for (const id of this.raw.recentRequesters) {
    //         await this.client.hideJoinRequest(this.chatId, { user: id, action })
    //     }
    // }
}

makeInspectable(ChatJoinRequestUpdate)
