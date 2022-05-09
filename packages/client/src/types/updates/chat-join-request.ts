import { TelegramClient } from '../../client'
import { ChatInviteLink, PeersIndex, User } from '../peers'
import { tl } from '@mtcute/tl'
import { getBarePeerId } from '@mtcute/core'

/**
 * This update is sent when a user requests to join a chat
 * via invite link with approvals.
 *
 * > **NOTE**: This update is only received by users,
 * > if you are using a bot, see {@link BotChatJoinRequestUpdate}
 */
export class ChatJoinRequestUpdate {
    constructor(
        readonly client: TelegramClient,
        readonly raw: tl.RawUpdatePendingJoinRequests,
        readonly _peers: PeersIndex
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
        if (!this._recentRequesters) {
            this._recentRequesters = this.raw.recentRequesters.map(
                (id) => new User(this.client, this._peers.user(id))
            )
        }

        return this._recentRequesters
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
    hideLast(
        action: Parameters<TelegramClient['hideJoinRequest']>[2]
    ): Promise<void> {
        return this.client.hideJoinRequest(
            this.chatId,
            this.raw.recentRequesters[0],
            action
        )
    }

    /**
     * Approve or deny all recent requests
     * (the ones available in {@link recentRequesters})
     */
    async hideAllRecent(
        action: Parameters<TelegramClient['hideJoinRequest']>[2]
    ): Promise<void> {
        for (const id of this.raw.recentRequesters) {
            await this.client.hideJoinRequest(this.chatId, id, action)
        }
    }

    /**
     * Fetch all pending join requests for this chat
     */
    fetchAll(params?: {
        limit?: number
        search?: string
    }): AsyncIterableIterator<ChatInviteLink.JoinedMember> {
        return this.client.getInviteLinkMembers(this.chatId, {
            limit: params?.limit,
            requested: true,
            requestedSearch: params?.search,
        })
    }
}
