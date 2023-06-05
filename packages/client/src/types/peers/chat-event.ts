import { toggleChannelIdMark } from '@mtcute/core'
import { tl } from '@mtcute/tl'

import { TelegramClient } from '../../client'
import { Photo } from '../media'
import { Message } from '../messages'
import { makeInspectable } from '../utils'
import { ChatInviteLink } from './chat-invite-link'
import { ChatLocation } from './chat-location'
import { ChatMember } from './chat-member'
import { ChatPermissions } from './chat-permissions'
import { PeersIndex } from './index'
import { User } from './user'

/** A user has joined the group (in the case of big groups, info of the user that has joined isn't shown) */
export interface ChatActionUserJoined {
    type: 'user_joined'
}

/** A user has joined the group using an invite link */
export interface ChatActionUserJoinedInvite {
    type: 'user_joined_invite'

    /** Invite link user to join */
    link: ChatInviteLink
}

/** A user has left the group (in the case of big groups, info of the user that has joined isn't shown) */
export interface ChatActionUserLeft {
    type: 'user_left'
}

/** A user was invited to the group */
export interface ChatActionUserInvited {
    type: 'user_invited'

    /** Member who has been invited */
    member: ChatMember
}

/** Group title has been changed */
export interface ChatActionTitleChanged {
    type: 'title_changed'

    /** Old chat title */
    old: string

    /** New chat title */
    new: string
}

/** Group description has been changed */
export interface ChatActionDescriptionChanged {
    type: 'description_changed'

    /** Old description */
    old: string

    /** New description */
    new: string
}

/** Group username has been changed */
export interface ChatActionUsernameChanged {
    type: 'username_changed'

    /** Old username */
    old: string

    /** New username */
    new: string
}

/** Group photo has been changed */
export interface ChatActionPhotoChanged {
    type: 'photo_changed'

    /** Old photo */
    old: Photo

    /** New photo */
    new: Photo
}

/** Invites were enabled/disabled */
export interface ChatActionInvitesToggled {
    type: 'invites_toggled'

    /** Old value */
    old: boolean

    /** New value */
    new: boolean
}

/** Signatures were enabled/disabled */
export interface ChatActionSignaturesToggled {
    type: 'signatures_toggled'

    /** Old value */
    old: boolean

    /** New value */
    new: boolean
}

/** A message has been pinned */
export interface ChatActionMessagePinned {
    type: 'msg_pinned'

    /** Message which was pinned */
    message: Message
}

/** A message has been edited */
export interface ChatActionMessageEdited {
    type: 'msg_edited'

    /** Old message */
    old: Message

    /** New message */
    new: Message
}

/** A message has been deleted */
export interface ChatActionMessageDeleted {
    type: 'msg_deleted'

    /** Message which was deleted */
    message: Message
}

/** User's permissions were changed */
export interface ChatActionUserPermissionsChanged {
    type: 'user_perms_changed'

    /** Information about member before change */
    old: ChatMember

    /** Information about member after change */
    new: ChatMember
}

/** User's admin permissions were changed */
export interface ChatActionUserAdminPermissionsChanged {
    type: 'user_admin_perms_changed'

    /** Information about member before change */
    old: ChatMember

    /** Information about member after change */
    new: ChatMember
}

/** Group stickerset has been changed */
export interface ChatActionStickersetChanged {
    type: 'stickerset_changed'

    /** Old stickerset */
    old: tl.TypeInputStickerSet

    /** New stickerset */
    new: tl.TypeInputStickerSet
}

/** History visibility for new users has been toggled */
export interface ChatActionHistoryToggled {
    type: 'history_toggled'

    /** Old value (`false` if new users can see history) */
    old: boolean

    /** New value (`false` if new users can see history) */
    new: boolean
}

/** Group default permissions have been changed */
export interface ChatActionDefaultPermissionsChanged {
    type: 'def_perms_changed'

    /** Old default permissions */
    old: ChatPermissions

    /** New default permissions */
    new: ChatPermissions
}

/** Poll has been stopped */
export interface ChatActionPollStopped {
    type: 'poll_stopped'

    /** Message containing the poll */
    message: Message
}

/** Linked chat has been changed */
export interface ChatActionLinkedChatChanged {
    type: 'linked_chat_changed'

    /** ID of the old linked chat */
    old: number

    /** ID of the new linked chat */
    new: number
}

/** Group location has been changed */
export interface ChatActionLocationChanged {
    type: 'location_changed'

    /** Old location */
    old: ChatLocation | null

    /** New location */
    new: ChatLocation | null
}

/** Group slow mode delay has been changed */
export interface ChatActionSlowModeChanged {
    type: 'slow_mode_changed'

    /** Old delay (can be 0) */
    old: number

    /** New delay (can be 0) */
    new: number
}

/** Group call has been started */
export interface ChatActionCallStarted {
    type: 'call_started'

    /** TL object representing the call */
    call: tl.TypeInputGroupCall
}

/** Group call has ended */
export interface ChatActionCallEnded {
    type: 'call_ended'

    /** TL object representing the call */
    call: tl.TypeInputGroupCall
}

/** Group call "join muted" setting has been changed */
export interface ChatActionCallSettingChanged {
    type: 'call_setting_changed'

    /** Whether new call participants should join muted */
    joinMuted: boolean
}

/** Invite link has been deleted */
export interface ChatActionInviteLinkDeleted {
    type: 'invite_deleted'

    /** Invite link which was deleted */
    link: ChatInviteLink
}

/** Invite link has been edited */
export interface ChatActionInviteLinkEdited {
    type: 'invite_edited'

    /** Old invite link */
    old: ChatInviteLink

    /** New invite link */
    new: ChatInviteLink
}

/** Invite link has been revoked */
export interface ChatActionInviteLinkRevoked {
    type: 'invite_revoked'

    /** Invite link which was revoked */
    link: ChatInviteLink
}

/** History TTL has been changed */
export interface ChatActionTtlChanged {
    type: 'ttl_changed'

    /** Old TTL value (can be 0) */
    old: number

    /** New TTL value (can be 0) */
    new: number
}

/** Chat event action (`null` if unsupported) */
export type ChatAction =
    | ChatActionUserJoined
    | ChatActionUserLeft
    | ChatActionUserInvited
    | ChatActionTitleChanged
    | ChatActionDescriptionChanged
    | ChatActionUsernameChanged
    | ChatActionPhotoChanged
    | ChatActionInvitesToggled
    | ChatActionSignaturesToggled
    | ChatActionMessagePinned
    | ChatActionMessageEdited
    | ChatActionMessageDeleted
    | ChatActionUserPermissionsChanged
    | ChatActionUserAdminPermissionsChanged
    | ChatActionStickersetChanged
    | ChatActionHistoryToggled
    | ChatActionDefaultPermissionsChanged
    | ChatActionPollStopped
    | ChatActionLinkedChatChanged
    | ChatActionLocationChanged
    | ChatActionSlowModeChanged
    | ChatActionCallStarted
    | ChatActionCallEnded
    | ChatActionCallSettingChanged
    | ChatActionUserJoinedInvite
    | ChatActionInviteLinkDeleted
    | ChatActionInviteLinkEdited
    | ChatActionInviteLinkRevoked
    | ChatActionTtlChanged
    | null

function _actionFromTl(
    this: ChatEvent,
    e: tl.TypeChannelAdminLogEventAction,
): ChatAction {
    switch (e._) {
        case 'channelAdminLogEventActionParticipantJoin':
            return { type: 'user_joined' }
        case 'channelAdminLogEventActionChangeTitle':
            return {
                type: 'title_changed',
                old: e.prevValue,
                new: e.newValue,
            }
        case 'channelAdminLogEventActionChangeAbout':
            return {
                type: 'description_changed',
                old: e.prevValue,
                new: e.newValue,
            }
        case 'channelAdminLogEventActionChangeUsername':
            return {
                type: 'username_changed',
                old: e.prevValue,
                new: e.newValue,
            }
        case 'channelAdminLogEventActionChangePhoto':
            return {
                type: 'photo_changed',
                old: new Photo(this.client, e.prevPhoto as tl.RawPhoto),
                new: new Photo(this.client, e.newPhoto as tl.RawPhoto),
            }
        case 'channelAdminLogEventActionToggleInvites':
            return {
                type: 'invites_toggled',
                old: !e.newValue,
                new: e.newValue,
            }
        case 'channelAdminLogEventActionToggleSignatures':
            return {
                type: 'signatures_toggled',
                old: !e.newValue,
                new: e.newValue,
            }
        case 'channelAdminLogEventActionUpdatePinned':
            return {
                type: 'msg_pinned',
                message: new Message(this.client, e.message, this._peers),
            }
        case 'channelAdminLogEventActionEditMessage':
            return {
                type: 'msg_edited',
                old: new Message(this.client, e.prevMessage, this._peers),
                new: new Message(this.client, e.newMessage, this._peers),
            }
        case 'channelAdminLogEventActionDeleteMessage':
            return {
                type: 'msg_deleted',
                message: new Message(this.client, e.message, this._peers),
            }
        case 'channelAdminLogEventActionParticipantLeave':
            return { type: 'user_left' }
        case 'channelAdminLogEventActionParticipantInvite':
            return {
                type: 'user_invited',
                member: new ChatMember(this.client, e.participant, this._peers),
            }
        case 'channelAdminLogEventActionParticipantToggleBan':
            return {
                type: 'user_perms_changed',
                old: new ChatMember(
                    this.client,
                    e.prevParticipant,
                    this._peers,
                ),
                new: new ChatMember(this.client, e.newParticipant, this._peers),
            }
        case 'channelAdminLogEventActionParticipantToggleAdmin':
            return {
                type: 'user_admin_perms_changed',
                old: new ChatMember(
                    this.client,
                    e.prevParticipant,
                    this._peers,
                ),
                new: new ChatMember(this.client, e.newParticipant, this._peers),
            }
        case 'channelAdminLogEventActionChangeStickerSet':
            return {
                type: 'stickerset_changed',
                old: e.prevStickerset,
                new: e.newStickerset,
            }
        case 'channelAdminLogEventActionTogglePreHistoryHidden':
            return {
                type: 'history_toggled',
                old: !e.newValue,
                new: e.newValue,
            }
        case 'channelAdminLogEventActionDefaultBannedRights':
            return {
                type: 'def_perms_changed',
                old: new ChatPermissions(e.prevBannedRights),
                new: new ChatPermissions(e.newBannedRights),
            }
        case 'channelAdminLogEventActionStopPoll':
            return {
                type: 'poll_stopped',
                message: new Message(this.client, e.message, this._peers),
            }
        case 'channelAdminLogEventActionChangeLinkedChat':
            return {
                type: 'linked_chat_changed',
                old: toggleChannelIdMark(e.prevValue),
                new: toggleChannelIdMark(e.newValue),
            }
        case 'channelAdminLogEventActionChangeLocation':
            return {
                type: 'location_changed',
                old:
                    e.prevValue._ === 'channelLocationEmpty' ?
                        null :
                        new ChatLocation(this.client, e.prevValue),
                new:
                    e.newValue._ === 'channelLocationEmpty' ?
                        null :
                        new ChatLocation(this.client, e.newValue),
            }
        case 'channelAdminLogEventActionToggleSlowMode':
            return {
                type: 'slow_mode_changed',
                old: e.prevValue,
                new: e.newValue,
            }
        case 'channelAdminLogEventActionStartGroupCall':
            return {
                type: 'call_started',
                call: e.call,
            }
        case 'channelAdminLogEventActionDiscardGroupCall':
            return {
                type: 'call_ended',
                call: e.call,
            }
        case 'channelAdminLogEventActionParticipantMute':
        case 'channelAdminLogEventActionParticipantUnmute':
        case 'channelAdminLogEventActionParticipantVolume':
            // todo
            return null
        case 'channelAdminLogEventActionToggleGroupCallSetting':
            return {
                type: 'call_setting_changed',
                joinMuted: e.joinMuted,
            }
        case 'channelAdminLogEventActionParticipantJoinByInvite':
            return {
                type: 'user_joined_invite',
                link: new ChatInviteLink(this.client, e.invite, this._peers),
            }
        case 'channelAdminLogEventActionExportedInviteDelete':
            return {
                type: 'invite_deleted',
                link: new ChatInviteLink(this.client, e.invite, this._peers),
            }
        case 'channelAdminLogEventActionExportedInviteRevoke':
            return {
                type: 'invite_revoked',
                link: new ChatInviteLink(this.client, e.invite, this._peers),
            }
        case 'channelAdminLogEventActionExportedInviteEdit':
            return {
                type: 'invite_edited',
                old: new ChatInviteLink(this.client, e.prevInvite, this._peers),
                new: new ChatInviteLink(this.client, e.newInvite, this._peers),
            }
        case 'channelAdminLogEventActionChangeHistoryTTL':
            return {
                type: 'ttl_changed',
                old: e.prevValue,
                new: e.newValue,
            }
        default:
            return null
    }
}

export class ChatEvent {
    constructor(
        readonly client: TelegramClient,
        readonly raw: tl.TypeChannelAdminLogEvent,
        readonly _peers: PeersIndex,
    ) {}

    /**
     * Event ID.
     *
     * Event IDs are generated in direct chronological order
     * (i.e. newer events have bigger event ID)
     */
    get id(): tl.Long {
        return this.raw.id
    }

    /**
     * Date of the event
     */
    get date(): Date {
        return new Date(this.raw.date * 1000)
    }

    private _actor?: User
    /**
     * Actor of the event
     */
    get actor(): User {
        return (this._actor ??= new User(
            this.client,
            this._peers.user(this.raw.userId),
        ))
    }

    private _action?: ChatAction
    get action(): ChatAction {
        return (this._action ??= _actionFromTl.call(this, this.raw.action))
    }
}

makeInspectable(ChatEvent)
