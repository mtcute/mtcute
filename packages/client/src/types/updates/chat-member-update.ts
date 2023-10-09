import { getMarkedPeerId, tl } from '@mtcute/core'

import { makeInspectable } from '../../utils'
import { Chat } from '../peers/chat'
import { ChatInviteLink } from '../peers/chat-invite-link'
import { ChatMember } from '../peers/chat-member'
import { PeersIndex } from '../peers/peers-index'
import { User } from '../peers/user'

/**
 * Type of the event. Can be one of:
 *  - `joined`: User `user` joined the chat/channel on their own
 *  - `added`: User `actor` added another user `user` to the chat
 *  - `left`: User `user` left the channel on their own
 *  - `kicked`: User `user` was kicked from the chat by `actor`
 *  - `unkicked`: User `user` was removed from the list of kicked users by `actor` and can join the chat again
 *  - `restricted`: User `user` was restricted by `actor`
 *  - `unrestricted`: User `user` was unrestricted by `actor`
 *  - `unrestricted_promoted`: User `user` was unrestricted AND promoted to an admin by `actor`
 *  - `promoted`: User `user` was promoted to admin by `actor`
 *  - `demoted`: User `user` was demoted from admin by `actor`
 *  - `demoted_restricted`: User `user` was demoted from admin AND restricted by `actor`
 *  - `demoted_kicked`: User `user` was demoted from admin AND kicked by `actor`
 *  - `old_owner`: User `user` transferred their own chat ownership
 *  - `new_owner`: User `actor` transferred their chat ownership to `user`
 *  - `other`: Some other event (e.g. change in restrictions, change in admin rights, etc.)
 */
export type ChatMemberUpdateType =
    | 'joined'
    | 'added'
    | 'left'
    | 'kicked'
    | 'unkicked'
    | 'restricted'
    | 'unrestricted'
    | 'unrestricted_promoted'
    | 'promoted'
    | 'demoted'
    | 'demoted_restricted'
    | 'demoted_kicked'
    | 'old_owner'
    | 'new_owner'
    | 'other'

function extractPeerId(raw?: tl.TypeChatParticipant | tl.TypeChannelParticipant) {
    if (!raw) return 0

    if (tl.isAnyChatParticipant(raw)) {
        return raw.userId
    }

    switch (raw._) {
        case 'channelParticipant':
        case 'channelParticipantSelf':
        case 'channelParticipantCreator':
        case 'channelParticipantAdmin':
            return raw.userId
        default:
            return getMarkedPeerId(raw.peer)
    }
}

/**
 * Update representing a change in the status
 * of a chat/channel member.
 */
export class ChatMemberUpdate {
    constructor(
        readonly raw: tl.RawUpdateChatParticipant | tl.RawUpdateChannelParticipant,
        readonly _peers: PeersIndex,
    ) {}

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

    private _type?: ChatMemberUpdateType
    /**
     * Type of the update
     *
     * @link ChatMemberUpdate.Type
     */
    get type(): ChatMemberUpdateType {
        if (!this._type) {
            // we do not use `.actor`, `.newMember` and `.oldMember`,
            // since using them would mean creating objects,
            // which will probably be useless in case this property
            // is used inside of a filter
            // fortunately, all the info is available as-is and does not require
            // additional parsing

            const old = this.raw.prevParticipant
            const cur = this.raw.newParticipant

            const oldId = extractPeerId(old)
            const curId = extractPeerId(cur)

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

            switch (old._) {
                case 'chatParticipant':
                case 'channelParticipant':
                    switch (cur._) {
                        case 'chatParticipantAdmin':
                        case 'channelParticipantAdmin':
                            return (this._type = 'promoted')
                        case 'channelParticipantBanned':
                            // kicked or restricted
                            if (cur.left) return (this._type = 'kicked')

                            return (this._type = 'restricted')
                    }
                    break
                case 'chatParticipantCreator':
                case 'channelParticipantCreator':
                    return (this._type = 'old_owner')
            }

            switch (cur._) {
                case 'chatParticipantCreator':
                case 'channelParticipantCreator':
                    return (this._type = 'new_owner')
            }

            if (old._ === 'channelParticipantBanned' && cur._ === 'channelParticipant') {
                return (this._type = 'unrestricted')
            }

            if (old._ === 'channelParticipantBanned' && cur._ === 'channelParticipantAdmin') {
                return (this._type = 'unrestricted_promoted')
            }

            if (old._ === 'channelParticipantAdmin' && cur._ === 'channelParticipant') {
                return (this._type = 'demoted')
            }

            if (old._ === 'channelParticipantAdmin' && cur._ === 'channelParticipantBanned') {
                return (this._type = cur.left ? 'demoted_kicked' : 'demoted_restricted')
            }

            if (old._ === 'channelParticipantBanned' && cur._ === 'channelParticipantBanned' && old.left !== cur.left) {
                if (actorId === curId) {
                    return (this._type = cur.left ? 'left' : 'joined')
                }

                return (this._type = cur.left ? 'kicked' : 'added')
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
            const id = this.raw._ === 'updateChannelParticipant' ? this.raw.channelId : this.raw.chatId
            this._chat = new Chat(this._peers.chat(id))
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
        return (this._actor ??= new User(this._peers.user(this.raw.actorId)))
    }

    private _user?: User
    /**
     * User representing the chat member whose status was changed.
     */
    get user(): User {
        return (this._user ??= new User(this._peers.user(this.raw.userId)))
    }

    /** Whether this is a self-made action (i.e. actor == user) */
    get isSelfMade(): boolean {
        return this.raw.actorId === this.raw.userId
    }

    private _oldMember?: ChatMember
    /**
     * Previous (old) information about chat member.
     */
    get oldMember(): ChatMember | null {
        if (!this.raw.prevParticipant) return null

        return (this._oldMember ??= new ChatMember(this.raw.prevParticipant, this._peers))
    }

    private _newMember?: ChatMember
    /**
     * Current (new) information about chat member.
     */
    get newMember(): ChatMember | null {
        if (!this.raw.newParticipant) return null

        return (this._newMember ??= new ChatMember(this.raw.newParticipant, this._peers))
    }

    private _inviteLink?: ChatInviteLink
    /**
     * In case this is a "join" event, invite link that was used to join (if any)
     */
    get inviteLink(): ChatInviteLink | null {
        if (!this.raw.invite) return null

        return (this._inviteLink ??= new ChatInviteLink(this.raw.invite))
    }
}

makeInspectable(ChatMemberUpdate)
