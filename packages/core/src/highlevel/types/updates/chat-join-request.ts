import { tl } from '@mtcute/tl'

import { getBarePeerId } from '../../../utils/peer-utils.js'
import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { PeersIndex, User } from '../peers/index.js'

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

    /**
     * Users who recently requested to join the chat
     */
    get recentRequesters(): User[] {
        return this.raw.recentRequesters.map((id) => new User(this._peers.user(id)))
    }

    /**
     * Total number of pending requests
     */
    get totalPending(): number {
        return this.raw.requestsPending
    }
}

memoizeGetters(ChatJoinRequestUpdate, ['recentRequesters'])
makeInspectable(ChatJoinRequestUpdate)
