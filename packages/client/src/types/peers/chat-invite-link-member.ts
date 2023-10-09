import { tl } from '@mtcute/core'

import { makeInspectable } from '../../utils'
import { PeersIndex } from './peers-index'
import { User } from './user'

export class ChatInviteLinkMember {
    constructor(
        readonly raw: tl.RawChatInviteImporter,
        readonly _peers: PeersIndex,
    ) {}

    private _user?: User
    /**
     * User who joined the chat
     */
    get user(): User {
        return (this._user ??= new User(this._peers.user(this.raw.userId)))
    }

    /**
     * Date when the user joined the chat
     */
    get date(): Date {
        return new Date(this.raw.date * 1000)
    }

    /**
     * Whether this user currently has a pending join request
     * (and is actually not a member yet)
     */
    get isPendingRequest(): boolean {
        return this.raw.requested!
    }

    /**
     * Whether the participant joined by importing a chat folder deep link
     */
    get isViaChatlist(): boolean {
        return this.raw.requested!
    }

    /**
     * For users with pending requests, contains bio of the user that requested to join
     */
    get bio(): string | null {
        return this.raw.about ?? null
    }

    private _approvedBy?: User
    /**
     * The administrator that approved the join request of the user
     */
    get approvedBy(): User | null {
        if (!this.raw.approvedBy) return null

        return (this._approvedBy ??= new User(this._peers.user(this.raw.approvedBy)))
    }
}

makeInspectable(ChatInviteLinkMember)
