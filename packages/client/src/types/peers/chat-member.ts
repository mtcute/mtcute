import { makeInspectable } from '../utils'
import { TelegramClient } from '../../client'
import { tl } from '@mtcute/tl'
import { User } from './user'
import { assertTypeIs } from '../../utils/type-assertion'
import { ChatPermissions } from './chat-permissions'

export namespace ChatMember {
    /**
     * Status of the member:
     *  - `creator`: user is the creator of the chat
     *  - `admin`: user has admin rights in the chat
     *  - `member`: user is a normal member of the chat
     *  - `restricted`: user has some restrictions applied
     *  - `banned`: user was banned from the chat
     *  - `left`: user left the chat on their own
     */
    export type Status =
        | 'creator'
        | 'admin'
        | 'member'
        | 'restricted'
        | 'banned'
        | 'left'
}

/**
 * Information about one chat member
 */
export class ChatMember {
    readonly client: TelegramClient
    readonly raw: tl.TypeChatParticipant | tl.TypeChannelParticipant

    /** Map of users in this object. Mainly for internal use */
    readonly _users: Record<number, tl.TypeUser>

    constructor(
        client: TelegramClient,
        raw: tl.TypeChatParticipant | tl.TypeChannelParticipant,
        users: Record<number, tl.TypeUser>,
    ) {
        this.client = client
        this.raw = raw
        this._users = users
    }

    private _user?: User
    /**
     * Information about the user
     */
    get user(): User {
        if (this._user === undefined) {
            if (
                this.raw._ === 'channelParticipantBanned' ||
                this.raw._ === 'channelParticipantLeft'
            ) {
                assertTypeIs(
                    'ChatMember#user (raw.peer)',
                    this.raw.peer,
                    'peerUser'
                )
                this._user = new User(
                    this.client,
                    this._users[this.raw.peer.userId] as tl.RawUser
                )
            } else {
                this._user = new User(
                    this.client,
                    this._users[this.raw.userId] as tl.RawUser
                )
            }
        }

        return this._user
    }

    /**
     * Get the chat member status
     */
    get status(): ChatMember.Status {
        if (
            this.raw._ === 'channelParticipant' ||
            this.raw._ === 'channelParticipantSelf' ||
            this.raw._ === 'chatParticipant'
        ) {
            return 'member'
        }

        if (
            this.raw._ === 'channelParticipantCreator' ||
            this.raw._ === 'chatParticipantCreator'
        ) {
            return 'creator'
        }

        if (
            this.raw._ === 'channelParticipantAdmin' ||
            this.raw._ === 'chatParticipantAdmin'
        ) {
            return 'admin'
        }

        if (this.raw._ === 'channelParticipantLeft') {
            return 'left'
        }

        if (this.raw._ === 'channelParticipantBanned') {
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
        return this.raw._ === 'channelParticipantCreator' ||
            this.raw._ === 'channelParticipantAdmin'
            ? this.raw.rank ?? null
            : null
    }

    /**
     * Date when the user has joined the chat.
     *
     * Not available for creators and left members
     */
    get joinedDate(): Date | null {
        return this.raw._ === 'channelParticipantCreator' ||
            this.raw._ === 'chatParticipantCreator' ||
            this.raw._ === 'channelParticipantLeft'
            ? null
            : new Date(this.raw.date * 1000)
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
            if (
                this.raw._ !== 'chatParticipantCreator' &&
                this.raw._ !== 'channelParticipantCreator' &&
                this.raw._ !== 'channelParticipant' &&
                this.raw._ !== 'channelParticipantBanned' &&
                this.raw._ !== 'channelParticipantLeft' &&
                this.raw.inviterId
            ) {
                this._invitedBy = new User(
                    this.client,
                    this._users[this.raw.inviterId] as tl.RawUser
                )
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
                this._promotedBy = new User(
                    this.client,
                    this._users[this.raw.promotedBy] as tl.RawUser
                )
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
                this._restrictedBy = new User(
                    this.client,
                    this._users[this.raw.kickedBy] as tl.RawUser
                )
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

        if (!this._restrictions) {
            this._restrictions = new ChatPermissions(this.raw.bannedRights)
        }

        return this._restrictions
    }

    /**
     * Whether this member is a part of the chat now.
     *
     * Makes sense only when `status = restricted or staus = banned`
     */
    get isMember(): boolean {
        return this.raw._ === 'channelParticipantBanned'
            ? !this.raw.left
            : this.raw._ !== 'channelParticipantLeft'
    }

    /**
     * For admins and creator of supergroup/channels,
     * list of their admin permissions.
     *
     * Also contains whether this admin is anonymous.
     */
    get permissions(): tl.RawChatAdminRights | null {
        return this.raw._ === 'channelParticipantAdmin' ||
            this.raw._ === 'channelParticipantCreator'
            ? this.raw.adminRights
            : null
    }
}

makeInspectable(ChatMember)
