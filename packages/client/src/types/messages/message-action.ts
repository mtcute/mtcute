import { tl } from '@mtcute/tl'
import { Photo } from '../media'
import {
    _callDiscardReasonFromTl,
    CallDiscardReason,
} from '../calls/discard-reason'
import { Message } from './message'

export namespace MessageAction {
    /** Group was created */
    export interface ActionChatCreated {
        readonly type: 'chat_created'

        /** Group name */
        readonly title: string

        /** IDs of the users in the group */
        readonly users: number[]
    }

    /** Channel/supergroup was created */
    export interface ActionChannelCreated {
        readonly type: 'channel_created'

        /** Original channel/supergroup title */
        readonly title: string
    }

    /** Chat was migrated to a supergroup with a given ID */
    export interface ActionChatMigrateTo {
        readonly type: 'chat_migrate_to'

        /** Marked ID of the supergroup chat was migrated to */
        readonly id: number
    }

    /** Supergroup was migrated from a chat with a given ID */
    export interface ActionChannelMigrateFrom {
        readonly type: 'channel_migrate_from'

        /** Marked ID of the chat this channel was migrated from */
        readonly id: number

        /** Old chat's title */
        readonly title: string
    }

    /**
     * A message has been pinned.
     *
     * To get the message itself, use {@link Message.getReplyTo}
     */
    export interface ActionMessagePinned {
        readonly type: 'message_pinned'
    }

    /** History was cleared in a private chat. */
    export interface ActionHistoryCleared {
        readonly type: 'history_cleared'
    }

    /** Someone scored in a game (usually only used for newly set high scores) */
    export interface ActionGameScore {
        readonly type: 'game_score'

        /** Game ID */
        readonly gameId: tl.Long

        /** Score */
        readonly score: number
    }

    /** Contact has joined Telegram */
    export interface ActionContactJoined {
        readonly type: 'contact_joined'
    }

    /** Group title was changed */
    export interface ActionTitleChanged {
        readonly type: 'title_changed'

        /** New group name */
        readonly title: string
    }

    /** Group photo was changed */
    export interface ActionPhotoChanged {
        readonly type: 'photo_changed'

        /** New group photo */
        readonly photo: Photo
    }

    /** Group photo was deleted */
    export interface ActionPhotoDeleted {
        readonly type: 'photo_deleted'
    }

    /** Users were added to the chat */
    export interface ActionUsersAdded {
        readonly type: 'users_added'

        /** IDs of the users that were added */
        readonly users: number[]
    }

    /** User has left the group */
    export interface ActionUserLeft {
        readonly type: 'user_left'
    }

    /** User was removed from the group */
    export interface ActionUserRemoved {
        readonly type: 'user_removed'

        /** ID of the user that was removed from the group */
        readonly user: number
    }

    /** User has joined the group via an invite link */
    export interface ActionUserJoinedLink {
        readonly type: 'user_joined_link'

        /** ID of the user who created the link */
        readonly inviter: number
    }

    /** A payment was received from a user (bot) */
    export interface ActionPaymentReceived {
        readonly type: 'payment_received'

        /** Three-letter ISO 4217 currency code */
        readonly currency: string

        /**
         * Price of the product in the smallest units of the currency
         * (integer, not float/double). For example, for a price of
         * `US$ 1.45`, `amount = 145`
         */
        readonly amount: tl.Long

        /** Bot specified invoice payload */
        readonly payload: Buffer

        /** Order information provided by the user */
        readonly info?: tl.TypePaymentRequestedInfo

        /** ID of the shipping option chosen by the user */
        readonly shippingOptionId?: string

        /** Payment provider ID */
        readonly charge?: tl.TypePaymentCharge
    }

    /** A payment was sent to a user */
    export interface ActionPaymentSent {
        readonly type: 'payment_sent'

        /** Three-letter ISO 4217 currency code */
        readonly currency: string

        /**
         * Price of the product in the smallest units of the currency
         * (integer, not float/double). For example, for a price of
         * `US$ 1.45`, `amount = 145`
         */
        readonly amount: tl.Long
    }

    /** A phone call */
    export interface ActionCall {
        readonly type: 'call'

        /** Call ID */
        readonly id: tl.Long

        /** Whether this is a video call */
        readonly isVideo: boolean

        /** Duration if the call in seconds (0 if not available) */
        readonly duration: number

        /** Call discard reason, if available */
        readonly reason?: CallDiscardReason
    }

    /** A screenshot was taken */
    export interface ActionScreenshotTaken {
        readonly type: 'screenshot_taken'
    }

    /** User has authorized via the bot */
    export interface ActionBotAllowed {
        readonly type: 'bot_allowed'

        /** Domain where the user has logged in */
        readonly domain: string
    }

    /**
     * A user is in proximity of another user
     * (see [Proximity alerts]{https://core.telegram.org/api/live-location#proximity-alert})
     */
    export interface ActionGeoProximity {
        readonly type: 'geo_proximity'

        /** ID of the user who sent the geolocation with proximity alerts */
        readonly targetId: number

        /** ID of the user who has approached `targetId` */
        readonly userId: number

        /** Distance between them in meters */
        readonly distance: number
    }

    /** Group call has started */
    export interface ActionGroupCallStarted {
        readonly type: 'group_call_started'

        /** TL object representing the call */
        readonly call: tl.TypeInputGroupCall
    }

    /** Group call has ended */
    export interface ActionGroupCallEnded {
        readonly type: 'group_call_ended'

        /** TL object representing the call */
        readonly call: tl.TypeInputGroupCall

        /** Duration of the call */
        readonly duration: number
    }

    /** Group call has ended */
    export interface ActionGroupInvite {
        readonly type: 'group_call_invite'

        /** TL object representing the call */
        readonly call: tl.TypeInputGroupCall

        /** IDs of the users invited to the call */
        readonly userIds: number[]
    }

    /** Messages TTL changed */
    export interface ActionSetTtl {
        readonly type: 'set_ttl'

        /** New TTL period */
        readonly period: number
    }
}

export type MessageAction =
    | MessageAction.ActionChatCreated
    | MessageAction.ActionChannelCreated
    | MessageAction.ActionChatMigrateTo
    | MessageAction.ActionChannelMigrateFrom
    | MessageAction.ActionMessagePinned
    | MessageAction.ActionHistoryCleared
    | MessageAction.ActionGameScore
    | MessageAction.ActionContactJoined
    | MessageAction.ActionTitleChanged
    | MessageAction.ActionPhotoChanged
    | MessageAction.ActionPhotoDeleted
    | MessageAction.ActionUsersAdded
    | MessageAction.ActionUserLeft
    | MessageAction.ActionUserRemoved
    | MessageAction.ActionUserJoinedLink
    | MessageAction.ActionPaymentReceived
    | MessageAction.ActionPaymentSent
    | MessageAction.ActionCall
    | MessageAction.ActionScreenshotTaken
    | MessageAction.ActionBotAllowed
    | MessageAction.ActionGeoProximity
    | MessageAction.ActionGroupCallStarted
    | MessageAction.ActionGroupCallEnded
    | MessageAction.ActionGroupInvite
    | MessageAction.ActionSetTtl
    | null

/** @internal */
export function _messageActionFromTl(
    this: Message,
    act: tl.TypeMessageAction
): MessageAction {
    switch (act._) {
        case 'messageActionChatCreate':
            return {
                type: 'chat_created',
                title: act.title,
                users: act.users,
            }
        case 'messageActionChannelCreate':
            return {
                type: 'channel_created',
                title: act.title,
            }
        case 'messageActionChatMigrateTo':
            return {
                type: 'chat_migrate_to',
                id: act.channelId,
            }
        case 'messageActionChannelMigrateFrom':
            return {
                type: 'channel_migrate_from',
                id: act.chatId,
                title: act.title,
            }
        case 'messageActionPinMessage':
            return {
                type: 'message_pinned',
            }
        case 'messageActionHistoryClear':
            return {
                type: 'history_cleared',
            }
        case 'messageActionGameScore':
            return {
                type: 'game_score',
                gameId: act.gameId,
                score: act.score,
            }
        case 'messageActionContactSignUp':
            return {
                type: 'contact_joined',
            }
        case 'messageActionChatEditTitle':
            return {
                type: 'title_changed',
                title: act.title,
            }
        case 'messageActionChatEditPhoto':
            return {
                type: 'photo_changed',
                photo: new Photo(this.client, act.photo as tl.RawPhoto),
            }
        case 'messageActionChatDeletePhoto':
            return {
                type: 'photo_deleted',
            }
        case 'messageActionChatAddUser':
            return {
                type: 'users_added',
                users: act.users,
            }
        case 'messageActionChatDeleteUser':
            if (
                this.raw.fromId?._ === 'peerUser' &&
                act.userId === this.raw.fromId.userId
            ) {
                return {
                    type: 'user_left',
                }
            } else {
                return {
                    type: 'user_removed',
                    user: act.userId,
                }
            }
        case 'messageActionChatJoinedByLink':
            return {
                type: 'user_joined_link',
                inviter: act.inviterId,
            }
        case 'messageActionPaymentSentMe':
            return {
                type: 'payment_received',
                currency: act.currency,
                amount: act.totalAmount,
                payload: act.payload,
                info: act.info,
                shippingOptionId: act.shippingOptionId,
                charge: act.charge,
            }
        case 'messageActionPaymentSent':
            return {
                type: 'payment_sent',
                currency: act.currency,
                amount: act.totalAmount,
            }
        case 'messageActionPhoneCall':
            return {
                type: 'call',
                id: act.callId,
                isVideo: !!act.video,
                reason: act.reason
                    ? _callDiscardReasonFromTl(act.reason)
                    : undefined,
                duration: act.duration ?? 0,
            }
        case 'messageActionScreenshotTaken':
            return {
                type: 'screenshot_taken',
            }
        case 'messageActionBotAllowed':
            return {
                type: 'bot_allowed',
                domain: act.domain,
            }
        case 'messageActionGeoProximityReached':
            if (act.fromId._ !== 'peerUser' || act.toId._ !== 'peerUser') {
                return null
            } else {
                return {
                    type: 'geo_proximity',
                    targetId: act.toId.userId,
                    userId: act.fromId.userId,
                    distance: act.distance,
                }
            }
        case 'messageActionGroupCall':
            if (act.duration) {
                return {
                    type: 'group_call_ended',
                    call: act.call,
                    duration: act.duration,
                }
            } else {
                return {
                    type: 'group_call_started',
                    call: act.call,
                }
            }
        case 'messageActionInviteToGroupCall':
            return {
                type: 'group_call_invite',
                call: act.call,
                userIds: act.users,
            }
        case 'messageActionSetMessagesTTL':
            return {
                type: 'set_ttl',
                period: act.period,
            }
        default:
            return null
    }
}
