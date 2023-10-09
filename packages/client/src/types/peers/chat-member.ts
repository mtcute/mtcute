import { tl } from '@mtcute/core'
import { assertTypeIs } from '@mtcute/core/utils'

import { makeInspectable } from '../../utils'
import { ChatPermissions } from './chat-permissions'
import { PeersIndex } from './index'
import { User } from './user'

/**
 * Status of the member:
 *  - `creator`: user is the creator of the chat
 *  - `admin`: user has admin rights in the chat
 *  - `member`: user is a normal member of the chat
 *  - `restricted`: user has some restrictions applied
 *  - `banned`: user was banned from the chat
 *  - `left`: user left the chat on their own
 */
export type ChatMemberStatus = 'creator' | 'admin' | 'member' | 'restricted' | 'banned' | 'left'

/**
 * Information about one chat member
 */
export class ChatMember {
    constructor(
        readonly raw: tl.TypeChatParticipant | tl.TypeChannelParticipant,
        readonly _peers: PeersIndex,
    ) {}

    private _user?: User
    /**
     * Information about the user
     */
    get user(): User {
        if (this._user === undefined) {
            switch (this.raw._) {
                case 'channelParticipantBanned':
                case 'channelParticipantLeft':
                    assertTypeIs('ChatMember#user (raw.peer)', this.raw.peer, 'peerUser')

                    this._user = new User(this._peers.user(this.raw.peer.userId))
                    break
                default:
                    this._user = new User(this._peers.user(this.raw.userId))
                    break
            }
        }

        return this._user
    }

    /**
     * Get the chat member status
     */
    get status(): ChatMemberStatus {
        switch (this.raw._) {
            case 'channelParticipant':
            case 'channelParticipantSelf':
            case 'chatParticipant':
                return 'member'
            case 'channelParticipantCreator':
            case 'chatParticipantCreator':
                return 'creator'
            case 'channelParticipantAdmin':
            case 'chatParticipantAdmin':
                return 'admin'
            case 'channelParticipantLeft':
                return 'left'
            case 'channelParticipantBanned':
                return this.raw.bannedRights.viewMessages ? 'banned' : 'restricted'
        }

        // fallback
        return 'member'
    }

    /**
     * Custom title (for creators and admins).
     *
     * `null` for non-admins and in case custom title is not set.
     */
    get title(): string | null {
        switch (this.raw._) {
            case 'channelParticipantCreator':
            case 'channelParticipantAdmin':
                return this.raw.rank ?? null
            default:
                return null
        }
    }

    /**
     * Date when the user has joined the chat.
     *
     * Not available for creators and left members
     */
    get joinedDate(): Date | null {
        switch (this.raw._) {
            case 'channelParticipantCreator':
            case 'chatParticipantCreator':
            case 'channelParticipantLeft':
                return null
            default:
                return new Date(this.raw.date * 1000)
        }
    }

    private _invitedBy?: User | null
    /**
     * Information about whoever invited this member to the chat.
     *
     * Only available in the following cases:
     *  - `user` is yourself
     *  - `chat` is a legacy group
     *  - `chat` is a supergroup/channel, and `user` is an admin
     */
    get invitedBy(): User | null {
        if (this._invitedBy === undefined) {
            if ('inviterId' in this.raw && this.raw.inviterId) {
                this._invitedBy = new User(this._peers.user(this.raw.inviterId))
            } else {
                this._invitedBy = null
            }
        }

        return this._invitedBy
    }

    private _promotedBy?: User | null
    /**
     * Information about whoever promoted this admin.
     *
     * Only available if `status = admin`.
     */
    get promotedBy(): User | null {
        if (this._promotedBy === undefined) {
            if (this.raw._ === 'channelParticipantAdmin') {
                this._promotedBy = new User(this._peers.user(this.raw.promotedBy))
            } else {
                this._promotedBy = null
            }
        }

        return this._promotedBy
    }

    private _restrictedBy?: User | null
    /**
     * Information about whoever restricted this user.
     *
     * Only available if `status = restricted or status = banned`
     */
    get restrictedBy(): User | null {
        if (this._restrictedBy === undefined) {
            if (this.raw._ === 'channelParticipantBanned') {
                this._restrictedBy = new User(this._peers.user(this.raw.kickedBy))
            } else {
                this._restrictedBy = null
            }
        }

        return this._restrictedBy
    }

    private _restrictions?: ChatPermissions
    /**
     * For restricted and banned users,
     * information about the restrictions
     */
    get restrictions(): ChatPermissions | null {
        if (this.raw._ !== 'channelParticipantBanned') return null

        return (this._restrictions ??= new ChatPermissions(this.raw.bannedRights))
    }

    /**
     * Whether this member is a part of the chat now.
     *
     * Makes sense only when `status = restricted or staus = banned`
     */
    get isMember(): boolean {
        return this.raw._ === 'channelParticipantBanned' ? !this.raw.left : this.raw._ !== 'channelParticipantLeft'
    }

    /**
     * For admins and creator of supergroup/channels,
     * list of their admin permissions.
     *
     * Also contains whether this admin is anonymous.
     */
    get permissions(): tl.RawChatAdminRights | null {
        switch (this.raw._) {
            case 'channelParticipantAdmin':
            case 'channelParticipantCreator':
                return this.raw.adminRights
            default:
                return null
        }
    }
}

makeInspectable(ChatMember)
