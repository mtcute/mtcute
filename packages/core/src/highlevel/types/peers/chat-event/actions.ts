import { tl } from '@mtcute/tl'

import { toggleChannelIdMark } from '../../../../utils/peer-utils.js'
import { assertTypeIs } from '../../../../utils/type-assertions.js'
import { Photo } from '../../media/photo.js'
import { Message } from '../../messages/message.js'
import { ChatInviteLink } from '../chat-invite-link.js'
import { ChatLocation } from '../chat-location.js'
import { ChatMember } from '../chat-member.js'
import { ChatPermissions } from '../chat-permissions.js'
import { ForumTopic } from '../forum-topic.js'
import { PeersIndex } from '../peers-index.js'
import { User } from '../user.js'

/** A user has joined the channel (in the case of big groups, info of the user that has joined isn't shown) */
export interface ChatActionUserJoined {
    type: 'user_joined'
}

/** A user has joined the channel using an invite link */
export interface ChatActionUserJoinedInvite {
    type: 'user_joined_invite'

    /** Invite link user to join */
    link: ChatInviteLink
}

/** A user has joined the channel using an invite link and was approved by an admin */
export interface ChatActionUserJoinedApproved {
    type: 'user_joined_approved'

    /** Invite link user to join */
    link: ChatInviteLink

    /** User who approved the join */
    approvedBy: User
}

/** A user has left the channel (in the case of big groups, info of the user that has joined isn't shown) */
export interface ChatActionUserLeft {
    type: 'user_left'
}

/** A user was invited to the channel */
export interface ChatActionUserInvited {
    type: 'user_invited'

    /** Member who has been invited */
    member: ChatMember
}

/** Channel title has been changed */
export interface ChatActionTitleChanged {
    type: 'title_changed'

    /** Old chat title */
    old: string

    /** New chat title */
    new: string
}

/** Channel description has been changed */
export interface ChatActionDescriptionChanged {
    type: 'description_changed'

    /** Old description */
    old: string

    /** New description */
    new: string
}

/** Channel username has been changed */
export interface ChatActionUsernameChanged {
    type: 'username_changed'

    /** Old username */
    old: string

    /** New username */
    new: string
}

/** Channel username list has been changed */
export interface ChatActionUsernamesChanged {
    type: 'usernames_changed'

    /** Old username */
    old: string[]

    /** New username */
    new: string[]
}

/** Channel photo has been changed */
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

/** Content protection has been toggled */
export interface ChatActionNoForwardsToggled {
    type: 'no_forwards_toggled'

    /** New status */
    enabled: boolean
}

/** Forum has been toggled */
export interface ChatActionForumToggled {
    type: 'forum_toggled'

    /** New status */
    enabled: boolean
}

/** Forum topic has been created */
export interface ChatActionTopicCreated {
    type: 'topic_created'

    /** Topic that has been created */
    topic: ForumTopic
}

/** Forum topic has been edited */
export interface ChatActionTopicEdited {
    type: 'topic_edited'

    /** Old topic info */
    old: ForumTopic

    /** New topic info */
    new: ForumTopic
}

/** Forum topic has been edited */
export interface ChatActionTopicDeleted {
    type: 'topic_deleted'

    /** Old topic info */
    topic: ForumTopic
}

/** Chat event action (`null` if unsupported) */
export type ChatAction =
    | ChatActionUserJoined
    | ChatActionUserLeft
    | ChatActionUserInvited
    | ChatActionTitleChanged
    | ChatActionDescriptionChanged
    | ChatActionUsernameChanged
    | ChatActionUsernamesChanged
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
    | ChatActionUserJoinedApproved
    | ChatActionTtlChanged
    | ChatActionNoForwardsToggled
    | ChatActionForumToggled
    | ChatActionTopicCreated
    | ChatActionTopicEdited
    | ChatActionTopicDeleted
    | null

/** @internal */
export function _actionFromTl(e: tl.TypeChannelAdminLogEventAction, peers: PeersIndex): ChatAction {
    // todo - MTQ-72
    // channelAdminLogEventActionSendMessage#278f2868 message:Message = ChannelAdminLogEventAction;
    // channelAdminLogEventActionChangeAvailableReactions#be4e0ef8 prev_value:ChatReactions new_value:ChatReactions
    // channelAdminLogEventActionToggleAntiSpam#64f36dfc new_value:Bool = ChannelAdminLogEventAction;

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
        case 'channelAdminLogEventActionChangeUsernames':
            return {
                type: 'usernames_changed',
                old: e.prevValue,
                new: e.newValue,
            }
        case 'channelAdminLogEventActionChangePhoto':
            return {
                type: 'photo_changed',
                old: new Photo(e.prevPhoto as tl.RawPhoto),
                new: new Photo(e.newPhoto as tl.RawPhoto),
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
                message: new Message(e.message, peers),
            }
        case 'channelAdminLogEventActionEditMessage':
            return {
                type: 'msg_edited',
                old: new Message(e.prevMessage, peers),
                new: new Message(e.newMessage, peers),
            }
        case 'channelAdminLogEventActionDeleteMessage':
            return {
                type: 'msg_deleted',
                message: new Message(e.message, peers),
            }
        case 'channelAdminLogEventActionParticipantLeave':
            return { type: 'user_left' }
        case 'channelAdminLogEventActionParticipantInvite':
            return {
                type: 'user_invited',
                member: new ChatMember(e.participant, peers),
            }
        case 'channelAdminLogEventActionParticipantToggleBan':
            return {
                type: 'user_perms_changed',
                old: new ChatMember(e.prevParticipant, peers),
                new: new ChatMember(e.newParticipant, peers),
            }
        case 'channelAdminLogEventActionParticipantToggleAdmin':
            return {
                type: 'user_admin_perms_changed',
                old: new ChatMember(e.prevParticipant, peers),
                new: new ChatMember(e.newParticipant, peers),
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
                message: new Message(e.message, peers),
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
                old: e.prevValue._ === 'channelLocationEmpty' ? null : new ChatLocation(e.prevValue),
                new: e.newValue._ === 'channelLocationEmpty' ? null : new ChatLocation(e.newValue),
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
                link: new ChatInviteLink(e.invite, peers),
            }
        case 'channelAdminLogEventActionExportedInviteDelete':
            return {
                type: 'invite_deleted',
                link: new ChatInviteLink(e.invite, peers),
            }
        case 'channelAdminLogEventActionExportedInviteRevoke':
            return {
                type: 'invite_revoked',
                link: new ChatInviteLink(e.invite, peers),
            }
        case 'channelAdminLogEventActionExportedInviteEdit':
            return {
                type: 'invite_edited',
                old: new ChatInviteLink(e.prevInvite, peers),
                new: new ChatInviteLink(e.newInvite, peers),
            }
        case 'channelAdminLogEventActionChangeHistoryTTL':
            return {
                type: 'ttl_changed',
                old: e.prevValue,
                new: e.newValue,
            }
        case 'channelAdminLogEventActionParticipantJoinByRequest':
            return {
                type: 'user_joined_approved',
                link: new ChatInviteLink(e.invite, peers),
                approvedBy: new User(peers.user(e.approvedBy)),
            }
        // channelAdminLogEventActionCreateTopic#58707d28 topic:ForumTopic = ChannelAdminLogEventAction;
        // channelAdminLogEventActionEditTopic#f06fe208 prev_topic:ForumTopic new_topic:ForumTopic
        // channelAdminLogEventActionDeleteTopic#ae168909 topic:ForumTopic = ChannelAdminLogEventAction;
        case 'channelAdminLogEventActionToggleForum':
            return {
                type: 'forum_toggled',
                enabled: e.newValue,
            }
        case 'channelAdminLogEventActionCreateTopic':
            assertTypeIs('ChannelAdminLogEventActionCreateTopic#topic', e.topic, 'forumTopic')

            return {
                type: 'topic_created',
                topic: new ForumTopic(e.topic, peers),
            }
        case 'channelAdminLogEventActionEditTopic':
            assertTypeIs('ChannelAdminLogEventActionCreateTopic#topic', e.prevTopic, 'forumTopic')
            assertTypeIs('ChannelAdminLogEventActionCreateTopic#topic', e.newTopic, 'forumTopic')

            return {
                type: 'topic_edited',
                old: new ForumTopic(e.prevTopic, peers),
                new: new ForumTopic(e.newTopic, peers),
            }
        case 'channelAdminLogEventActionDeleteTopic':
            assertTypeIs('ChannelAdminLogEventActionCreateTopic#topic', e.topic, 'forumTopic')

            return {
                type: 'topic_deleted',
                topic: new ForumTopic(e.topic, peers),
            }
        case 'channelAdminLogEventActionToggleNoForwards':
            return {
                type: 'no_forwards_toggled',
                enabled: e.newValue,
            }
        // case 'channelAdminLogEventActionPinTopic'
        // ^ looks like it is not used, and pinned topics are not at all presented in the event log
        default:
            return null
    }
}
