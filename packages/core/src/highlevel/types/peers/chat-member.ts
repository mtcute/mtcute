import { tl } from '@mtcute/tl'

import { assertTypeIs } from '../../../utils/type-assertions.js'
import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { ChatPermissions } from './chat-permissions.js'
import { PeersIndex } from './index.js'
import { User } from './user.js'

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

    /**
     * Information about the user
     */
    get user(): User {
        switch (this.raw._) {
            case 'channelParticipantBanned':
            case 'channelParticipantLeft':
                assertTypeIs('ChatMember#user (raw.peer)', this.raw.peer, 'peerUser')

                return new User(this._peers.user(this.raw.peer.userId))
                break
            default:
                return new User(this._peers.user(this.raw.userId))
                break
        }
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

    /**
     * Information about whoever invited this member to the chat.
     *
     * Only available in the following cases:
     *  - `user` is yourself
     *  - `chat` is a legacy group
     *  - `chat` is a supergroup/channel, and `user` is an admin
     */
    get invitedBy(): User | null {
        if ('inviterId' in this.raw && this.raw.inviterId) {
            return new User(this._peers.user(this.raw.inviterId))
        }

        return null
    }

    /**
     * Information about whoever promoted this admin.
     *
     * Only available if `status = admin`.
     */
    get promotedBy(): User | null {
        if (this.raw._ === 'channelParticipantAdmin') {
            return new User(this._peers.user(this.raw.promotedBy))
        }

        return null
    }

    /**
     * Information about whoever restricted this user.
     *
     * Only available if `status = restricted or status = banned`
     */
    get restrictedBy(): User | null {
        if (this.raw._ === 'channelParticipantBanned') {
            return new User(this._peers.user(this.raw.kickedBy))
        }

        return null
    }

    /**
     * For restricted and banned users,
     * information about the restrictions
     */
    get restrictions(): ChatPermissions | null {
        if (this.raw._ !== 'channelParticipantBanned') return null

        return new ChatPermissions(this.raw.bannedRights)
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

memoizeGetters(ChatMember, ['user', 'invitedBy', 'promotedBy', 'restrictedBy', 'restrictions'])
makeInspectable(ChatMember)
