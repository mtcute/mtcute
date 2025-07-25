import type { tl } from '@mtcute/tl'

import type { TextWithEntities } from '../misc/entities.js'
import type { Peer } from '../peers/peer.js'
import type { Message } from './message.js'
import { assert } from '@fuman/utils'
import Long from 'long'
import { getMarkedPeerId } from '../../../utils/peer-utils.js'

import { Photo } from '../media/photo.js'
import { parsePeer } from '../peers/peer.js'
import { StarGiftUnique } from '../premium/stars-gift-unique.js'
import { StarGift } from '../premium/stars-gift.js'

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

/**
 * User has joined the group via an invite link
 * and was approved by an administrator
 */
export interface ActionUserJoinedApproved {
    readonly type: 'user_joined_approved'
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
    readonly payload: Uint8Array

    /** Order information provided by the user */
    readonly info?: tl.TypePaymentRequestedInfo

    /** ID of the shipping option chosen by the user */
    readonly shippingOptionId?: string

    /** Payment provider ID */
    readonly charge?: tl.TypePaymentCharge

    /** If this is a subscription being bought, the date when the subscription will expire */
    readonly subscriptionUntilDate?: Date
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

    /** If this is a subscription being bought, the date when the subscription will expire */
    readonly subscriptionUntilDate?: Date
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
    readonly reason?: tl.TypePhoneCallDiscardReason
}

/** A screenshot was taken */
export interface ActionScreenshotTaken {
    readonly type: 'screenshot_taken'
}

/** User has authorized via the bot */
export interface ActionBotAllowed {
    readonly type: 'bot_allowed'

    /** Domain where the user has logged in */
    readonly domain?: string
}

/**
 * A user is in proximity of another user
 * (see [Proximity alerts](https://core.telegram.org/api/live-location#proximity-alert))
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

/** Group call has been scheduled */
export interface ActionGroupCallScheduled {
    readonly type: 'group_call_scheduled'

    /** TL object representing the call */
    readonly call: tl.TypeInputGroupCall

    /** Date when the call will start */
    readonly date: Date
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
export interface ActionTtlChanged {
    readonly type: 'ttl_changed'

    /** New TTL period */
    readonly period: number
}

/** Forum topic was created */
export interface ActionTopicCreated {
    readonly type: 'topic_created'

    /** Title of the topic */
    title: string

    /** Icon color of the topic */
    iconColor: number

    /** Icon emoji of the topic */
    iconCustomEmoji?: tl.Long
}

/** Forum topic was modified */
export interface ActionTopicEdited {
    readonly type: 'topic_edited'

    /** New title of the topic */
    title?: string

    /** New icon emoji of the topic (may be empty) */
    iconCustomEmoji?: tl.Long

    /** Whether the topic was opened/closed */
    closed?: boolean

    /** Whether the topic was (un-)hidden - only for "General" topic (`id=1`) */
    hidden?: boolean
}

/** A non-standard action has happened in the chat */
export interface ActionCustom {
    readonly type: 'custom'

    /** Text to be shown in the interface */
    action: string
}

/** Chat theme was changed */
export interface ActionThemeChanged {
    readonly type: 'theme_changed'

    /** Emoji representing the new theme */
    emoji: string
}

/** Data was sent from a WebView (user-side action) */
export interface ActionWebviewDataSent {
    readonly type: 'webview_sent'

    /** Text of the button that was pressed to open the WebView */
    text: string
}

/** Data was received from a WebView (bot-side action) */
export interface ActionWebviewDataReceived {
    readonly type: 'webview_received'

    /** Text of the button that was pressed to open the WebView */
    text: string

    /** Data received from the WebView */
    data: string
}

/** Premium subscription was gifted */
export interface ActionPremiumGifted {
    readonly type: 'premium_gifted'

    /**
     * Currency in which it was paid for.
     * Three-letter ISO 4217 currency code)
     */
    currency: string

    /**
     * Price of the product in the smallest units of the currency
     * (integer, not float/double). For example, for a price of
     * `US$ 1.45`, `amount = 145`
     */
    amount: number

    /** Duration of the gifted subscription in months */
    months: number

    /** If the subscription was bought with crypto, information about it */
    crypto?: {
        /** Crypto currency name */
        currency: string
        /** Price in the smallest units */
        amount: number
    }

    /** Message attached to the gift */
    message?: TextWithEntities
}

/** A photo has been suggested as a profile photo */
export interface ActionPhotoSuggested {
    readonly type: 'photo_suggested'

    /** Photo that was suggested */
    photo: Photo
}

/**
 * A peer was chosen by the user after clicking on a RequestPeer button.
 * The user-side version of {@link ActionPeerChosen}
 */
export interface ActionPeerSent {
    readonly type: 'peer_sent'

    /** ID of the button passed earlier by the bot */
    buttonId: number

    /** Brief information about the chosen peers */
    peers: tl.TypeRequestedPeer[]
}

/**
 * A peer was chosen by the user after clicking on a RequestPeer button
 * The bot-side version of {@link ActionPeerSent}
 */
export interface ActionPeerChosen {
    readonly type: 'peer_chosen'

    /** ID of the button passed earlier by the bot */
    buttonId: number

    /** Chosen peers */
    peers: Peer[]
}

/** A wallpaper of the chathas been changed */
export interface ActionWallpaperChanged {
    readonly type: 'wallpaper_changed'

    /**
     * Whether the user has applied the same wallpaper
     * as the other party previously set in the chat
     */
    same: boolean

    /**
     * Whether the wallpaper was forcefully applied for
     * both sides, without explicit confirmation from the other
     * side.
     */
    forBoth: boolean

    /** TL object representing the new wallpaper */
    wallpaper: tl.TypeWallPaper
}

/** A Telergam Premium gift code was received */
export interface ActionGiftCode {
    readonly type: 'gift_code'

    /** Information about the gift code */
    raw: tl.RawMessageActionGiftCode

    /** Message attached to the gift */
    message?: TextWithEntities
}

/** A Telergam Premium giveaway was started */
export interface ActionGiveawayStarted {
    readonly type: 'giveaway_started'
}

/** A Telergam Premium giveaway was ended and results are available */
export interface ActionGiveawayEnded {
    readonly type: 'giveaway_ended'

    /** Number of winners in the giveaway */
    winners: number

    /** Number of undistributed prizes */
    undistributed: number
}

/** Boosts were applied to the group */
export interface ActionBoostApply {
    readonly type: 'boost_apply'

    /** Number of boosts applied */
    count: number
}

/** A payment was refunded */
export interface ActionPaymentRefunded {
    readonly type: 'payment_refunded'

    /** Three-letter ISO 4217 currency code */
    currency: string

    /** Marked ID of the peer where the stars were refunded (?) */
    peerId: number

    /** Number of `currency` refunded, in the smallest unit */
    amount: tl.Long

    /** Payload defined by the bot */
    payload?: Uint8Array

    /** Information about the charge */
    charge: tl.TypePaymentCharge
}

/** Telegram Stars were gifted by the other chat participant */
export interface ActionStarGifted {
    readonly type: 'stars_gifted'

    /** Whether `currency` is a cryptocurrency */
    isCrypto: boolean

    /** Currency in which the stars were paid for */
    currency: string

    /** Amount of `currency` that was paid */
    amount: tl.Long

    /** Amount of Telegram Stars that were gifted */
    stars: tl.Long

    /** Transaction ID, if available */
    transactionId?: string
}

/**
 * Telegram Stars were awarded in a giveaway
 */
export interface ActionStarsPrize {
    readonly type: 'stars_prize'

    /** Whether this prize was claimed yet */
    claimed: boolean

    /** Stars prize */
    stars: tl.Long

    /** Transaction ID */
    transactionId: string

    // todo: what does this mean?
    boostPeer: Peer

    /** Message ID containing the giveaway */
    giveawayMessageId: number
}

/** A star gift was sent */
export interface ActionStarGift {
    readonly type: 'stars_gift'

    /** Whether the sender chose to send the gift anonymously */
    nameHidden: boolean
    /** Whether this gift was saved to the recipient's profile */
    saved: boolean
    /** Whether this gift was refunded */
    refunded: boolean

    /** Whether this gift was converted to stars */
    converted: boolean
    /**
     * Amount of stars the gift can be converted to by the recipient
     * (0 if the gift cannot be converted)
     */
    convertStars: tl.Long

    /** Whether this gift can be upgraded to a unique gift */
    canUpgrade: boolean
    /** Whether this gift was upgraded to a unique gift */
    upgraded: boolean
    /** Number of stars to upgrade the gift to a unique gift (may be 0) */
    upgradeStars: tl.Long
    /** If the gift was upgraded, ID of the message where this happened */
    upgradeMsgId: number | null

    /** If the gift can be transferred, date when it can be re-sold */
    canTransferSince?: Date
    /** Number of stars this gift is up for resell for */
    resaleStars?: tl.Long
    /** If the gift can be re-sold, date when it will become available */
    canResellAt?: Date

    /** The gift itself */
    gift: StarGift | StarGiftUnique
    /** Message attached to the gift */
    message: TextWithEntities | null

    fromId?: number
    toId?: number
    savedId?: Long
}

/** Paid messages were paid for */
export interface ActionPaidMessagesPaid {
    readonly type: 'messages_paid'

    /** Amount of Telegram Stars paid */
    stars: tl.Long

    /** Whether the stars were paid for a direct message to channel administrators */
    broadcastDirect?: boolean
}

/** Paid messages were refunded */
export interface ActionPaidMessagesRefunded {
    readonly type: 'messages_refunded'

    /** Amount of Telegram Stars refunded */
    stars: tl.Long

    /** Count of messages refunded */
    count: number
}

/** One or more items in a todo list were completed or uncompleted */
export interface ActionTodoCompletions {
    readonly type: 'todo_completions'

    /** IDs of items that were marked as completed */
    completed: number[]

    /** IDs of items that were marked as non-completed */
    uncompleted: number[]
}

/** One or more items were added to a todo list */
export interface ActionTodoAppendTasks {
    readonly type: 'todo_append_tasks'

    /** Items that were added to the list */
    list: tl.RawTodoItem[]
}

/** A TON gift was sent */
export interface ActionTonGift {
    readonly type: 'ton_gift'

    /** Currency for {@link amount} */
    currency: string

    /** Amount of the gift in fiat currency */
    amount: tl.Long

    /** Crypto currency in which it was paid for */
    cryptoCurrency: string

    /** Amount of the gift in the crypto currency */
    cryptoAmount: tl.Long

    /** Transaction ID */
    transactionId?: string
}

export type MessageAction =
  | ActionChatCreated
  | ActionChannelCreated
  | ActionChatMigrateTo
  | ActionChannelMigrateFrom
  | ActionMessagePinned
  | ActionHistoryCleared
  | ActionGameScore
  | ActionContactJoined
  | ActionTitleChanged
  | ActionPhotoChanged
  | ActionPhotoDeleted
  | ActionUsersAdded
  | ActionUserLeft
  | ActionUserRemoved
  | ActionUserJoinedLink
  | ActionPaymentReceived
  | ActionPaymentSent
  | ActionCall
  | ActionScreenshotTaken
  | ActionBotAllowed
  | ActionGeoProximity
  | ActionGroupCallStarted
  | ActionGroupCallEnded
  | ActionGroupCallScheduled
  | ActionGroupInvite
  | ActionTtlChanged
  | ActionTopicCreated
  | ActionTopicEdited
  | ActionCustom
  | ActionThemeChanged
  | ActionUserJoinedApproved
  | ActionWebviewDataSent
  | ActionWebviewDataReceived
  | ActionPremiumGifted
  | ActionPhotoSuggested
  | ActionPeerSent
  | ActionPeerChosen
  | ActionWallpaperChanged
  | ActionGiftCode
  | ActionGiveawayStarted
  | ActionGiveawayEnded
  | ActionBoostApply
  | ActionPaymentRefunded
  | ActionStarGifted
  | ActionStarsPrize
  | ActionStarGift
  | ActionPaidMessagesPaid
  | ActionPaidMessagesRefunded
  | ActionTodoCompletions
  | ActionTodoAppendTasks
  | ActionTonGift
  | null

/** @internal */
export function _messageActionFromTl(this: Message, act: tl.TypeMessageAction): MessageAction {
    // todo - passport
    // messageActionSecureValuesSentMe#1b287353 values:Vector<SecureValue> credentials:SecureCredentialsEncrypted
    // messageActionSecureValuesSent#d95c6154 types:Vector<SecureValueType>
    // todo: suggested posts

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
                photo: new Photo(act.photo as tl.RawPhoto),
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
            if (this.raw.fromId?._ === 'peerUser' && act.userId === this.raw.fromId.userId) {
                return {
                    type: 'user_left',
                }
            }

            return {
                type: 'user_removed',
                user: act.userId,
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
                subscriptionUntilDate:
                    act.subscriptionUntilDate
                        ? new Date(act.subscriptionUntilDate * 1000)
                        : undefined,
            }
        case 'messageActionPaymentSent':
            return {
                type: 'payment_sent',
                currency: act.currency,
                amount: act.totalAmount,
                subscriptionUntilDate:
                    act.subscriptionUntilDate
                        ? new Date(act.subscriptionUntilDate * 1000)
                        : undefined,
            }
        case 'messageActionPhoneCall':
            return {
                type: 'call',
                id: act.callId,
                isVideo: Boolean(act.video),
                reason: act.reason,
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
            }

            return {
                type: 'geo_proximity',
                targetId: act.toId.userId,
                userId: act.fromId.userId,
                distance: act.distance,
            }

        case 'messageActionGroupCall':
            if (act.duration) {
                return {
                    type: 'group_call_ended',
                    call: act.call,
                    duration: act.duration,
                }
            }

            return {
                type: 'group_call_started',
                call: act.call,
            }
        case 'messageActionGroupCallScheduled':
            return {
                type: 'group_call_scheduled',
                call: act.call,
                date: new Date(act.scheduleDate * 1000),
            }
        case 'messageActionInviteToGroupCall':
            return {
                type: 'group_call_invite',
                call: act.call,
                userIds: act.users,
            }
        case 'messageActionSetMessagesTTL':
            return {
                type: 'ttl_changed',
                period: act.period,
            }
        case 'messageActionTopicCreate':
            return {
                type: 'topic_created',
                title: act.title,
                iconColor: act.iconColor,
                iconCustomEmoji: act.iconEmojiId,
            }
        case 'messageActionTopicEdit':
            return {
                type: 'topic_edited',
                title: act.title,
                iconCustomEmoji: act.iconEmojiId,
                closed: act.closed,
                hidden: act.hidden,
            }
        case 'messageActionCustomAction':
            return {
                type: 'custom',
                action: act.message,
            }
        case 'messageActionSetChatTheme':
            return {
                type: 'theme_changed',
                emoji: act.emoticon,
            }
        case 'messageActionChatJoinedByRequest':
            return {
                type: 'user_joined_approved',
            }
        case 'messageActionWebViewDataSent':
            return {
                type: 'webview_sent',
                text: act.text,
            }
        case 'messageActionWebViewDataSentMe':
            return {
                type: 'webview_received',
                text: act.text,
                data: act.data,
            }
        case 'messageActionGiftPremium':
            return {
                type: 'premium_gifted',
                currency: act.currency,
                amount: act.amount.toNumber(),
                months: act.months,
                crypto: act.cryptoAmount
                    ? {
                        currency: act.cryptoCurrency!,
                        amount: act.cryptoAmount.toNumber(),
                    }
                    : undefined,
                message: act.message,
            }
        case 'messageActionSuggestProfilePhoto':
            return {
                type: 'photo_suggested',
                photo: new Photo(act.photo as tl.RawPhoto),
            }
        case 'messageActionRequestedPeerSentMe':
            return {
                type: 'peer_sent',
                buttonId: act.buttonId,
                peers: act.peers,
            }
        case 'messageActionRequestedPeer':
            return {
                type: 'peer_chosen',
                buttonId: act.buttonId,
                peers: act.peers.map(it => parsePeer(it, this._peers)),
            }
        case 'messageActionSetChatWallPaper':
            return {
                type: 'wallpaper_changed',
                same: act.same!,
                forBoth: act.forBoth!,
                wallpaper: act.wallpaper,
            }
        case 'messageActionGiftCode':
            return {
                type: 'gift_code',
                raw: act,
                message: act.message,
            }
        case 'messageActionGiveawayLaunch':
            return {
                type: 'giveaway_started',
            }
        case 'messageActionGiveawayResults':
            return {
                type: 'giveaway_ended',
                winners: act.winnersCount,
                undistributed: act.unclaimedCount,
            }
        case 'messageActionBoostApply':
            return {
                type: 'boost_apply',
                count: act.boosts,
            }
        case 'messageActionPaymentRefunded':
            return {
                type: 'payment_refunded',
                currency: act.currency,
                peerId: getMarkedPeerId(act.peer),
                amount: act.totalAmount,
                payload: act.payload,
                charge: act.charge,
            }
        case 'messageActionGiftStars':
            return {
                type: 'stars_gifted',
                isCrypto: Boolean(act.cryptoCurrency),
                currency: act.cryptoCurrency ?? act.currency,
                amount: act.cryptoAmount ?? act.amount,
                stars: act.stars,
                transactionId: act.transactionId,
            }
        case 'messageActionPrizeStars':
            return {
                type: 'stars_prize',
                claimed: !act.unclaimed,
                stars: act.stars,
                transactionId: act.transactionId,
                boostPeer: parsePeer(act.boostPeer, this._peers),
                giveawayMessageId: act.giveawayMsgId,
            }
        case 'messageActionStarGift':
            assert(act.gift._ === 'starGift')
            return {
                type: 'stars_gift',
                nameHidden: act.nameHidden!,
                saved: act.saved!,
                converted: act.converted!,
                convertStars: act.convertStars ?? Long.ZERO,
                refunded: act.refunded!,
                gift: new StarGift(act.gift, this._peers),
                message: act.message ?? null,
                canUpgrade: act.canUpgrade!,
                upgraded: act.upgraded!,
                upgradeStars: act.upgradeStars ?? Long.ZERO,
                upgradeMsgId: act.upgradeMsgId ?? null,

                fromId: act.fromId ? getMarkedPeerId(act.fromId) : undefined,
                toId: act.peer ? getMarkedPeerId(act.peer) : undefined,
                savedId: act.savedId,
            }
        case 'messageActionStarGiftUnique':
            assert(act.gift._ === 'starGiftUnique')
            return {
                type: 'stars_gift',
                nameHidden: false,
                saved: act.saved!,
                converted: false,
                convertStars: Long.ZERO,
                refunded: act.refunded!,
                gift: new StarGiftUnique(act.gift, this._peers),
                message: null,
                canUpgrade: false,
                upgraded: true,
                upgradeStars: Long.ZERO,
                upgradeMsgId: null,
                canTransferSince: act.canTransferAt ? new Date(act.canTransferAt * 1000) : undefined,
                resaleStars: act.resaleStars,
                canResellAt: act.canResellAt ? new Date(act.canResellAt * 1000) : undefined,

                fromId: act.fromId ? getMarkedPeerId(act.fromId) : undefined,
                toId: act.peer ? getMarkedPeerId(act.peer) : undefined,
                savedId: act.savedId,
            }
        case 'messageActionPaidMessagesPrice':
            return {
                type: 'messages_paid',
                stars: act.stars,
            }
        case 'messageActionPaidMessagesRefunded':
            return {
                type: 'messages_refunded',
                stars: act.stars,
                count: act.count,
            }
        case 'messageActionTodoCompletions':
            return {
                type: 'todo_completions',
                completed: act.completed,
                uncompleted: act.incompleted,
            }
        case 'messageActionTodoAppendTasks':
            return {
                type: 'todo_append_tasks',
                list: act.list,
            }
        case 'messageActionGiftTon':
            return {
                type: 'ton_gift',
                currency: act.currency,
                amount: act.amount,
                cryptoCurrency: act.cryptoCurrency,
                cryptoAmount: act.cryptoAmount,
                transactionId: act.transactionId,
            }
        default:
            return null
    }
}
