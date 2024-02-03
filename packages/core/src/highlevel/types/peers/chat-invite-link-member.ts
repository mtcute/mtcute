import { tl } from '@mtcute/tl'

import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { PeersIndex } from './peers-index.js'
import { User } from './user.js'

export class ChatInviteLinkMember {
    constructor(
        readonly raw: tl.RawChatInviteImporter,
        readonly _peers: PeersIndex,
    ) {}

    /**
     * User who joined the chat
     */
    get user(): User {
        return new User(this._peers.user(this.raw.userId))
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

    /**
     * The administrator that approved the join request of the user
     */
    get approvedBy(): User | null {
        if (!this.raw.approvedBy) return null

        return new User(this._peers.user(this.raw.approvedBy))
    }
}

memoizeGetters(ChatInviteLinkMember, ['user', 'approvedBy'])
makeInspectable(ChatInviteLinkMember)
