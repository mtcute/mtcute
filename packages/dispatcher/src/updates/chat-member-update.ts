import { tl } from '@mtcute/tl'
import {
    Chat,
    ChatInviteLink,
    ChatMember,
    TelegramClient,
    User,
} from '@mtcute/client'
import { makeInspectable } from '@mtcute/client/src/types/utils'

export namespace ChatMemberUpdate {
    /**
     * Type of the event. Can be one of:
     *  - `joined`: User `user` joined the chat/channel on their own
     *  - `added`: User `actor` added another user `user` to the chat
     *  - `left`: User `user` left the channel on their own
     *  - `kicked`: User `user` was kicked from the chat by `actor`
     *  - `unkicked`: User `user` was removed from the list of kicked users by `actor` and can join the chat again
     *  - `restricted`: User `user` was restricted by `actor`
     *  - `unrestricted`: User `user` was unrestricted by `actor`
     *  - `promoted`: User `user` was promoted to admin by `actor`
     *  - `demoted`: User `user` was demoted from admin by `actor`
     *  - `old_owner`: User `user` transferred their own chat ownership
     *  - `new_owner`: User `actor` transferred their chat ownership to `user`
     *  - `other`: Some other event (e.g. change in restrictions, change in admin rights, etc.)
     */
    export type Type =
        | 'joined'
        | 'added'
        | 'left'
        | 'kicked'
        | 'unkicked'
        | 'restricted'
        | 'unrestricted'
        | 'promoted'
        | 'demoted'
        | 'old_owner'
        | 'new_owner'
        | 'other'
}

/**
 * Update representing a change in the status
 * of a chat/channel member.
 */
export class ChatMemberUpdate {
    readonly client: TelegramClient

    readonly raw: tl.RawUpdateChatParticipant | tl.RawUpdateChannelParticipant

    /** Map of users in this message. Mainly for internal use */
    readonly _users: Record<number, tl.TypeUser>
    /** Map of chats in this message. Mainly for internal use */
    readonly _chats: Record<number, tl.TypeChat>

    constructor(
        client: TelegramClient,
        raw: tl.RawUpdateChatParticipant | tl.RawUpdateChannelParticipant,
        users: Record<number, tl.TypeUser>,
        chats: Record<number, tl.TypeChat>
    ) {
        this.client = client
        this.raw = raw
        this._users = users
        this._chats = chats
    }

    /**
     * Date of the event
     */
    get date(): Date {
        return new Date(this.raw.date * 1000)
    }

    /**
     * Whether this is an update about current user
     */
    get isSelf(): boolean {
        return this.user.isSelf
    }

    private _type?: ChatMemberUpdate.Type
    /**
     * Type of the update
     *
     * @link ChatMemberUpdate.Type
     */
    get type(): ChatMemberUpdate.Type {
        if (!this._type) {
            // we do not use `.actor`, `.newMember` and `.oldMember`,
            // since using them would mean creating objects,
            // which will probably be useless in case this property
            // is used inside of a filter
            // fortunately, all the info is available as-is and does not require
            // additional parsing

            const old = this.raw.prevParticipant
            const cur = this.raw.newParticipant

            const oldId =
                (old && ((old as any).userId || (old as any).peer.userId)) ||
                null
            const curId =
                (cur && ((cur as any).userId || (cur as any).peer.userId)) ||
                null

            const actorId = this.raw.actorId

            if (!old && cur) {
                // join or added
                return (this._type = actorId === curId ? 'joined' : 'added')
            }

            if (old && !cur) {
                // left, kicked (for chats) or unkicked
                if (actorId === oldId) return (this._type = 'left')

                if (old._ === 'channelParticipantBanned') {
                    return (this._type = 'unkicked')
                }

                return (this._type = 'kicked')
            }

            // in this case OR is the same as AND, but AND doesn't work well with typescript :shrug:
            if (!old || !cur) return (this._type = 'other')

            if (old._ === 'chatParticipant' || old._ === 'channelParticipant') {
                if (
                    cur._ === 'chatParticipantAdmin' ||
                    cur._ === 'channelParticipantAdmin'
                ) {
                    return (this._type = 'promoted')
                }

                if (cur._ === 'channelParticipantBanned') {
                    // kicked or restricted
                    if (cur.left) return (this._type = 'kicked')

                    return (this._type = 'restricted')
                }
            }

            if (
                old._ === 'channelParticipantBanned' &&
                cur._ === 'channelParticipant'
            ) {
                return (this._type = 'unrestricted')
            }

            if (
                old._ === 'channelParticipantAdmin' &&
                cur._ === 'channelParticipant'
            ) {
                return (this._type = 'demoted')
            }

            if (
                old._ === 'chatParticipantCreator' ||
                old._ === 'channelParticipantCreator'
            ) {
                return (this._type = 'old_owner')
            }

            if (
                cur._ === 'chatParticipantCreator' ||
                cur._ === 'channelParticipantCreator'
            ) {
                return (this._type = 'new_owner')
            }

            return (this._type = 'other')
        }

        return this._type
    }

    private _chat?: Chat
    /**
     * Chat in which this event has occurred
     */
    get chat(): Chat {
        if (!this._chat) {
            const id =
                this.raw._ === 'updateChannelParticipant'
                    ? this.raw.channelId
                    : this.raw.chatId
            this._chat = new Chat(this.client, this._chats[id])
        }

        return this._chat
    }

    private _actor?: User
    /**
     * Performer of the action which resulted in this update.
     *
     * Can be chat/channel administrator or the {@link user} themself.
     */
    get actor(): User {
        if (!this._actor) {
            this._actor = new User(this.client, this._users[this.raw.actorId])
        }

        return this._actor
    }

    private _user?: User
    /**
     * User representing the chat member whose status was changed.
     */
    get user(): User {
        if (!this._user) {
            this._user = new User(this.client, this._users[this.raw.userId])
        }

        return this._user
    }

    private _oldMember?: ChatMember
    /**
     * Previous (old) information about chat member.
     */
    get oldMember(): ChatMember | null {
        if (!this.raw.prevParticipant) return null

        if (!this._oldMember) {
            this._oldMember = new ChatMember(
                this.client,
                this.raw.prevParticipant,
                this._users
            )
        }

        return this._oldMember
    }

    private _newMember?: ChatMember
    /**
     * Current (new) information about chat member.
     */
    get newMember(): ChatMember | null {
        if (!this.raw.newParticipant) return null

        if (!this._newMember) {
            this._newMember = new ChatMember(
                this.client,
                this.raw.newParticipant,
                this._users
            )
        }

        return this._newMember
    }

    private _inviteLink?: ChatInviteLink
    /**
     * In case this is a "join" event, invite link that was used to join (if any)
     */
    get inviteLink(): ChatInviteLink | null {
        if (!this.raw.invite) return null

        if (!this._inviteLink) {
            this._inviteLink = new ChatInviteLink(this.client, this.raw.invite)
        }

        return this._inviteLink
    }
}

makeInspectable(ChatMemberUpdate)
