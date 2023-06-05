import { getBarePeerId, getMarkedPeerId } from '@mtcute/core'
import { tl } from '@mtcute/tl'

import { TelegramClient } from '../../client'
import { Chat, ChatInviteLink, PeersIndex, User } from '../peers'
import { makeInspectable } from '../utils'

/**
 * This update is sent when a user requests to join a chat
 * via invite link with approvals.
 *
 * > **NOTE**: This update is only received by bots,
 * > if you are using a user-bot, see {@link ChatJoinRequestUpdate}
 */
export class BotChatJoinRequestUpdate {
    constructor(
        readonly client: TelegramClient,
        readonly raw: tl.RawUpdateBotChatInviteRequester,
        readonly _peers: PeersIndex,
    ) {}

    /**
     * Chat ID where the user is requesting to join.
     */
    get chatId(): number {
        return getMarkedPeerId(this.raw.peer)
    }

    private _chat?: Chat
    /**
     * Object containing the chat information.
     */
    get chat(): Chat {
        return (this._chat ??= new Chat(
            this.client,
            this._peers.chat(getBarePeerId(this.raw.peer)),
        ))
    }

    /**
     * ID of the user who requested to join the chat.
     */
    get userId(): number {
        return this.raw.userId
    }

    private _user?: User
    /**
     * Object containing the user information.
     */
    get user(): User {
        return (this._user ??= new User(
            this.client,
            this._peers.user(this.raw.userId),
        ))
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

    private _invite?: ChatInviteLink

    /**
     * Invite link used to request joining.
     */
    get invite(): ChatInviteLink {
        return (this._invite ??= new ChatInviteLink(
            this.client,
            this.raw.invite,
        ))
    }

    /**
     * Approve or deny the request.
     */
    hide(
        action: Parameters<TelegramClient['hideJoinRequest']>[2],
    ): Promise<void> {
        return this.client.hideJoinRequest(
            this.chat.inputPeer,
            this.user.inputPeer,
            action,
        )
    }
}

makeInspectable(BotChatJoinRequestUpdate)
