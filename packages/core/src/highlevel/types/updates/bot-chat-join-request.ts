import { tl } from '@mtcute/tl'

import { getBarePeerId, getMarkedPeerId } from '../../../utils/peer-utils.js'
import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { Chat, ChatInviteLink, PeersIndex, User } from '../peers/index.js'

/**
 * This update is sent when a user requests to join a chat
 * via invite link with approvals.
 *
 * > **NOTE**: This update is only received by bots,
 * > if you are using a user-bot, see {@link ChatJoinRequestUpdate}
 */
export class BotChatJoinRequestUpdate {
    constructor(
        readonly raw: tl.RawUpdateBotChatInviteRequester,
        readonly _peers: PeersIndex,
    ) {}

    /**
     * Chat ID where the user is requesting to join.
     */
    get chatId(): number {
        return getMarkedPeerId(this.raw.peer)
    }

    /**
     * Object containing the chat information.
     */
    get chat(): Chat {
        return new Chat(this._peers.chat(getBarePeerId(this.raw.peer)))
    }

    /**
     * ID of the user who requested to join the chat.
     */
    get userId(): number {
        return this.raw.userId
    }

    /**
     * Object containing the user information.
     */
    get user(): User {
        return new User(this._peers.user(this.raw.userId))
    }

    /**
     * Bio of the user who requested to join the chat.
     */
    get userBio(): string {
        return this.raw.about
    }

    /**
     * Date when the request was sent.
     */
    get date(): Date {
        return new Date(this.raw.date * 1000)
    }

    /**
     * Invite link used to request joining.
     */
    get invite(): ChatInviteLink {
        return new ChatInviteLink(this.raw.invite)
    }
}

memoizeGetters(BotChatJoinRequestUpdate, ['chat', 'user', 'invite'])
makeInspectable(BotChatJoinRequestUpdate)
