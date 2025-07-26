import type { tl } from '@mtcute/tl'

import { makeInspectable } from '../../utils/inspectable.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { Photo } from '../media/photo.js'

import { BusinessAccount } from '../premium/business-account.js'

import { BotVerification } from './bot-verification.js'
import { Chat } from './chat.js'
import { PeersIndex } from './peers-index.js'
import { User } from './user.js'

/**
 * Full information about a particular user.
 */
export class FullUser extends User {
    readonly peers: PeersIndex
    readonly full: tl.TypeUserFull

    constructor(obj: tl.users.TypeUserFull) {
        const peers = PeersIndex.from(obj)
        super(peers.user(obj.fullUser.id))

        this.peers = peers
        this.full = obj.fullUser
    }

    /** Whether this chat is archived */
    get isArchived(): boolean {
        return this.full.folderId === 1
    }

    /**
     * Whether this user has restricted sending them voice/video messages.
     */
    get hasBlockedVoices(): boolean {
        return this.full.voiceMessagesForbidden!
    }

    /** Whether the user is blocked by the current user */
    get isBlocked(): boolean {
        return this.full.blocked!
    }

    /** Whether the user can make/accept calls */
    get hasCallsAvailable(): boolean {
        return this.full.phoneCallsAvailable!
    }

    /** Whether the user can make/accept video calls */
    get hasVideoCallsAvailable(): boolean {
        return this.full.videoCallsAvailable!
    }

    /** Whether the current user can call this user */
    get canCall(): boolean {
        return !this.full.phoneCallsPrivate!
    }

    /** Whether the chat with this user has some scheduled messages */
    get hasScheduled(): boolean {
        return this.full.hasScheduled!
    }

    /** Whether the real-time translations popup should not be shown for this channel */
    get hasTranslationsDisabled(): boolean {
        return this.full.translationsDisabled!
    }

    /** Whether this chat has pinned stories */
    get hasPinnedStories(): boolean {
        return this.full.storiesPinnedAvailable!
    }

    /** Whether the current user has blocked this user from seeing our stories */
    get blockedMyStoriesFrom(): boolean {
        return this.full.blockedMyStoriesFrom!
    }

    /** Whether the chat with this user has a custom wallpaper */
    get hasCustomWallpaper(): boolean {
        return this.full.wallpaperOverridden!
    }

    /** Whether this user has hidden the exact read dates */
    get hasHiddenReadDate(): boolean {
        return this.full.readDatesPrivate!
    }

    /**
     * (Only for current user) Whether we have re-enabled sponsored messages,
     * despite having Telegram Premium
     */
    get hasSponsoredEnabled(): boolean {
        return this.full.sponsoredEnabled!
    }

    /** Whether the current user can view ad revenue for this bot */
    get canViewAdRevenue(): boolean {
        return this.full.canViewRevenue!
    }

    /**
     * Full information about this chat's photo, if any.
     *
     * Unlike {@link Chat.photo}, this field contains additional information
     * about the photo, such as its date, more sizes, and is the only
     * way to get the animated profile photo.
     *
     * This field takes into account any personal/fallback photo
     * that the user may have set
     */
    get fullPhoto(): Photo | null {
        if (!this.full) return null

        const photo = this.full.personalPhoto ?? this.full.profilePhoto ?? this.full.fallbackPhoto

        if (photo?._ !== 'photo') return null

        return new Photo(photo)
    }

    /**
     * A custom photo (set by the current user) that should be displayed
     * instead of the actual chat photo.
     *
     * Currently only available for users.
     */
    get personalPhoto(): Photo | null {
        if (!this.full || this.full._ !== 'userFull') return null
        if (this.full.personalPhoto?._ !== 'photo') return null

        return new Photo(this.full.personalPhoto)
    }

    /**
     * Actual profile photo of the user, bypassing the custom one.
     */
    get realPhoto(): Photo | null {
        if (!this.full) return null
        if (this.full._ !== 'userFull') return this.fullPhoto
        if (this.full.personalPhoto?._ !== 'photo') return null

        return new Photo(this.full.personalPhoto)
    }

    /**
     * A photo that the user has set to be shown
     * in case their actual profile photo is not available
     * due to privacy settings.
     *
     * Currently only available for users.
     */
    get publicPhoto(): Photo | null {
        if (!this.full || this.full._ !== 'userFull') return null
        if (this.full.fallbackPhoto?._ !== 'photo') return null

        return new Photo(this.full.fallbackPhoto)
    }

    /**
     * Bio of the other party in a private chat, or description of a
     * group, supergroup or channel.
     */
    get bio(): string {
        return this.full.about ?? ''
    }

    /** Number of star gifts the user has chosen to display on their profile */
    get starGiftsCount(): number {
        return this.full.stargiftsCount ?? 0
    }

    /** If this chat is a bot, whether the current user can manage its emoji status */
    get canManageBotEmojiStatus(): boolean {
        return this.full.botCanManageEmojiStatus!
    }

    get peerSettings(): tl.TypePeerSettings | null {
        return this.full.settings ?? null
    }

    /** Notification settings for this chat */
    get notificationsSettings(): tl.TypePeerNotifySettings | null {
        return this.full.notifySettings ?? null
    }

    /** ID of the last pinned message in the chat with this user */
    get pinnedMsgId(): number | null {
        return this.full.pinnedMsgId ?? null
    }

    /** Number of common chats with this user */
    get commonChatsCount(): number {
        return this.full.commonChatsCount
    }

    /** Anonymized text to be shown instead of the user's name when forwarding their messages */
    get privateForwardName(): string | null {
        return this.full.privateForwardName ?? null
    }

    /** Suggested admin rights for groups for this bot */
    get botGroupAdminRights(): tl.TypeChatAdminRights | null {
        return this.full.botGroupAdminRights ?? null
    }

    /** Suggested admin rights for channels for this bot */
    get botBroadcastAdminRights(): tl.TypeChatAdminRights | null {
        return this.full.botBroadcastAdminRights ?? null
    }

    /** Information about the user's birthday */
    get birthday(): tl.RawBirthday | null {
        return this.full.birthday ?? null
    }

    /**
     * Information about the user's personal channel.
     */
    get personalChannel(): Chat | null {
        if (this.full.personalChannelId == null) return null

        return new Chat(this.peers.chat(this.full.personalChannelId))
    }

    /** ID of the last message in {@link personalChannel} */
    get personalChannelMessageId(): number | null {
        return this.full.personalChannelMessage ?? null
    }

    /**
     * TTL of all messages in this chat, in seconds
     */
    get ttlPeriod(): number | null {
        return this.full?.ttlPeriod ?? null
    }

    /** Whether the "Gifts" tab should be shown */
    get showGifts(): boolean {
        return this.full.displayGiftsButton!
    }

    /** Information about the user's gift receive settings */
    get disallowedGifts(): tl.TypeDisallowedGiftsSettings | null {
        return this.full.disallowedGifts ?? null
    }

    /**
     * If this is a business account, information about the business.
     */
    get business(): BusinessAccount | null {
        if (
            this.full.businessWorkHours != null
            || this.full.businessLocation != null
            || this.full.businessGreetingMessage != null
            || this.full.businessAwayMessage != null
            || this.full.businessIntro != null
        ) {
            return new BusinessAccount(this.full)
        }
        return null
    }

    /** Information about a bot-issued verification (if any) */
    get botVerification(): BotVerification | null {
        if (!this.full.botVerification) return null

        return new BotVerification(this.full.botVerification)
    }

    /**
     * Information about the user's stars rating
     */
    get starsRating(): tl.RawStarsRating | null {
        return this.full.starsRating ?? null
    }
}

memoizeGetters(FullUser, [
    'fullPhoto',
    'personalPhoto',
    'realPhoto',
    'publicPhoto',
    'personalChannel',
    'business',
    'botVerification',
])
makeInspectable(FullUser)
