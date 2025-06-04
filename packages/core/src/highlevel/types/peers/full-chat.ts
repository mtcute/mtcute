import type { tl } from '@mtcute/tl'

import { makeInspectable } from '../../utils/inspectable.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { Photo } from '../media/photo.js'
import { StickerSet } from '../misc/sticker-set.js'

import { PeerStories } from '../stories/peer-stories.js'
import { BotInfo } from './bot-info.js'
import { BotVerification } from './bot-verification.js'
import { ChatInviteLink } from './chat-invite-link.js'
import { ChatLocation } from './chat-location.js'
import { Chat } from './chat.js'
import { PeersIndex } from './peers-index.js'
import { User } from './user.js'

/**
 * Full information about a particular chat.
 */
export class FullChat extends Chat {
    readonly peers: PeersIndex
    readonly full: tl.TypeChatFull

    constructor(obj: tl.messages.RawChatFull) {
        const peers = PeersIndex.from(obj)
        super(peers.chat(obj.fullChat.id))

        this.peers = peers
        this.full = obj.fullChat
    }

    /** Whether this chat is archived */
    get isArchived(): boolean {
        return this.full._ === 'channelFull' && this.full.folderId === 1
    }

    /** Whether paid reactions are enabled for this channel */
    get hasPaidReactions(): boolean {
        return this.full?._ === 'channelFull' && this.full.paidReactionsAvailable!
    }

    /** Whether this channel has hidden participants */
    get hasHiddenParticipants(): boolean {
        return this.full._ === 'channelFull' && !this.full.participantsHidden!
    }

    /** Whether the current user can change the chat's username */
    get canSetUsername(): boolean {
        return this.full.canSetUsername!
    }

    /** Whether the current user can change the chat's sticker set */
    get canSetStickers(): boolean {
        return this.full._ === 'channelFull' && this.full.canSetStickers!
    }

    /** Whether the history before we joined the chat is hidden */
    get hasHiddenHistory(): boolean {
        return this.full._ === 'channelFull' && this.full.hiddenPrehistory!
    }

    /** Whether there are scheduled messages in this chat */
    get hasScheduledMessages(): boolean {
        return this.full._ === 'channelFull' && this.full.hasScheduled!
    }

    /** Whether the current user can view the chat's statistics */
    get canViewStats(): boolean {
        return this.full._ === 'channelFull' && this.full.canViewStats!
    }

    /** Whether the current user can view the chat's participants list */
    get canViewParticipants(): boolean {
        return this.full._ === 'channelFull' && this.full.canViewParticipants!
    }

    /** Whether the current user can delete the chat */
    get canDeleteChat(): boolean {
        switch (this.full._) {
            case 'channelFull':
                return this.full.canDeleteChannel!
            case 'chatFull':
                return this.raw._ === 'chat' && this.raw.creator!
        }
    }

    /**
     * Whether the current user has blocked any anonumous admin of the supergroup.
     * If set, you won't receive mentions from them, nor their replies in `@replies`
     */
    get isBlocked(): boolean {
        return this.full._ === 'channelFull' && this.full.blocked!
    }

    /** Whether the native antispam is enabled for this channel */
    get hasNativeAntispam(): boolean {
        return this.full._ === 'channelFull' && this.full.antispam!
    }

    /** Whether the real-time translations popup should not be shown for this channel */
    get hasTranslationsDisabled(): boolean {
        return this.full._ === 'channelFull' && this.full.translationsDisabled!
    }

    /** Whether this chat has pinned stories */
    get hasPinnedStories(): boolean {
        return this.full._ === 'channelFull' && this.full.storiesPinnedAvailable!
    }

    /**
     * Whether ads on this channels were disabled
     * (this flag is only visible to channel owner)
     */
    get hasAdsDisabled(): boolean {
        return this.full._ === 'channelFull' && this.full.restrictedSponsored!
    }

    /** Whether sending paid media is available in this channel */
    get isPaidMediaAvailable(): boolean {
        return this.full._ === 'channelFull' && this.full.paidMediaAllowed!
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

        const photo = this.full.chatPhoto

        if (photo?._ !== 'photo') return null

        return new Photo(photo)
    }

    /**
     * Bio of the other party in a private chat, or description of a
     * group, supergroup or channel.
     */
    get bio(): string {
        return this.full.about
    }

    /**
     * Chat's primary invite link, if available
     */
    get inviteLink(): ChatInviteLink | null {
        switch (this.full.exportedInvite?._) {
            case 'chatInvitePublicJoinRequests':
                return null
            case 'chatInviteExported':
                return new ChatInviteLink(this.full.exportedInvite)
        }

        return null
    }

    /**
     * For supergroups, information about the group sticker set.
     */
    get stickerSet(): StickerSet | null {
        if (this.full?._ !== 'channelFull' || !this.full.stickerset) return null

        return new StickerSet(this.full.stickerset)
    }

    /**
     * For supergroups, information about the group emoji set.
     */
    get emojiSet(): StickerSet | null {
        if (this.full?._ !== 'channelFull' || !this.full.emojiset) return null

        return new StickerSet(this.full.emojiset)
    }

    /**
     * Whether the group sticker set can be changed by you.
     */
    get canSetStickerSet(): boolean | null {
        return this.full && this.full._ === 'channelFull' ? this.full.canSetStickers ?? null : null
    }

    /**
     * Number of boosts applied by the current user to this chat.
     */
    get boostsApplied(): number {
        if (!this.full || this.full._ !== 'channelFull') return 0

        return this.full?.boostsApplied ?? 0
    }

    /**
     * Number of boosts required for the user to be unrestricted in this chat.
     */
    get boostsForUnrestrict(): number {
        if (!this.full || this.full._ !== 'channelFull') return 0

        return this.full?.boostsUnrestrict ?? 0
    }

    /** Whether the current user can view Telegram Stars revenue for this chat */
    get canViewStarsRevenue(): boolean {
        return this.full._ === 'channelFull' && this.full.canViewStarsRevenue!
    }

    /** Whether the current user can view ad revenue for this chat */
    get canViewAdRevenue(): boolean {
        return this.full._ === 'channelFull' && this.full.canViewRevenue!
    }

    /** Number of admins in the chat (0 if not available) */
    get adminsCount(): number {
        return this.full._ === 'channelFull' ? this.full.adminsCount ?? 0 : 0
    }

    /** Number of users kicked from the chat (if available) */
    get kickedCount(): number | null {
        return this.full._ === 'channelFull' ? this.full.kickedCount ?? null : null
    }

    /** Number of users kicked from the chat (if available) */
    get bannedCount(): number | null {
        return this.full._ === 'channelFull' ? this.full.bannedCount ?? null : null
    }

    /** Number of members of the chat that are currently online */
    get onlineCount(): number {
        return this.full._ === 'channelFull' ? this.full.onlineCount ?? 0 : 0
    }

    /** ID of the last read incoming message in the chat */
    get readInboxMaxId(): number {
        return this.full._ === 'channelFull' ? this.full.readInboxMaxId : 0
    }

    /** ID of the last read outgoing message in the chat */
    get readOutboxMaxId(): number {
        return this.full._ === 'channelFull' ? this.full.readOutboxMaxId : 0
    }

    /** Number of unread messages in the chat */
    get unreadCount(): number {
        return this.full._ === 'channelFull' ? this.full.unreadCount : 0
    }

    /** Notification settings for this chat */
    get notificationsSettings(): tl.TypePeerNotifySettings | null {
        return this.full._ === 'channelFull' ? this.full.notifySettings ?? null : null
    }

    /** Information about bots in this chat */
    get botInfo(): BotInfo[] {
        return this.full._ === 'channelFull' ? this.full.botInfo.map(it => new BotInfo(it)) : []
    }

    /**
     * For supergroups, ID of the basic group from which this supergroup was upgraded,
     * and the identifier of the last message from the original group.
     */
    get migratedFrom(): { chatId: number, msgId: number } | null {
        if (this.full._ !== 'channelFull') return null
        if (!this.full.migratedFromChatId || !this.full.migratedFromMaxId) return null

        return {
            chatId: this.full.migratedFromChatId.toNumber(),
            msgId: this.full.migratedFromMaxId,
        }
    }

    /** For supergroups with hidden history, ID of the first message visible to the current user */
    get historyMinId(): number {
        return this.full._ === 'channelFull' ? this.full.availableMinId ?? 0 : 0
    }

    /** ID of the last pinned message in the chat */
    get pinnedMsgId(): number | null {
        return this.full._ === 'channelFull' ? this.full.pinnedMsgId ?? null : null
    }

    /**
     * Location of the chat.
     */
    get location(): ChatLocation | null {
        if (!this.full || this.full._ !== 'channelFull' || this.full.location?._ !== 'channelLocation') {
            return null
        }

        return new ChatLocation(this.full.location)
    }

    /**
     * Information about a linked chat:
     * - for channels: the discussion group
     * - for supergroups: the linked channel
     */
    get linkedChat(): Chat | null {
        if (this.full._ !== 'channelFull') return null
        if (!this.full.linkedChatId) return null

        return new Chat(this.peers.chat(this.full.linkedChatId))
    }

    /**
     * Information about a linked monoforum chat:
     * - for channels: the linked monoforum
     * - for monoforums: the channel this monoforum is linked to
     */
    get monoforumLinkedChat(): Chat | null {
        if (this.raw._ !== 'channel') return null
        if (!this.raw.linkedMonoforumId) return null

        return new Chat(this.peers.chat(this.raw.linkedMonoforumId))
    }

    /**
     * TTL of all messages in this chat, in seconds
     */
    get ttlPeriod(): number | null {
        return this.full?.ttlPeriod ?? null
    }

    /** Slowmode delay for this chat, if any */
    get slowmodeSeconds(): number | null {
        return this.full._ === 'channelFull' ? this.full.slowmodeSeconds ?? null : null
    }

    /**
     * For supergroups with slow mode, date of the next time the current user
     * will be able to send a message. `null` if they can send messages now.
     */
    get slowmodeNextSendDate(): Date | null {
        if (this.full._ !== 'channelFull' || !this.full.slowmodeNextSendDate) return null

        return new Date(this.full.slowmodeNextSendDate * 1000)
    }

    /** Number of pending join requests in the chat (only visible to admins) */
    get pendingJoinRequests(): number {
        return this.full._ === 'channelFull' ? this.full.requestsPending ?? 0 : 0
    }

    /** Users who have recently requested to join the chat (only visible to admins) */
    get recentRequesters(): User[] {
        if (this.full._ !== 'channelFull' || !this.full.recentRequesters) return []

        return this.full.recentRequesters.map(it => new User(this.peers.user(it)))
    }

    /** Reactions available in this chat */
    get availableReactions(): tl.TypeChatReactions | null {
        return this.full._ === 'channelFull' ? this.full.availableReactions ?? null : null
    }

    /** Maximum number of unique reactions on a single message in this chat, if any */
    get maxReactions(): number | null {
        return this.full._ === 'channelFull' ? this.full.reactionsLimit ?? null : null
    }

    /** Channel stories */
    get stories(): PeerStories | null {
        if (this.full._ !== 'channelFull' || !this.full.stories) return null

        return new PeerStories(this.full.stories, this.peers)
    }

    /** Information about a bot-issued verification (if any) */
    get botVerification(): BotVerification | null {
        if (this.full._ !== 'channelFull' || !this.full.botVerification) return null

        return new BotVerification(this.full.botVerification)
    }

    /** Whether star gifts are available in this chat */
    get starGiftsAvailable(): boolean {
        return this.full._ === 'channelFull' && this.full.stargiftsAvailable!
    }

    /** Number of star gifts available in this chat */
    get starGiftsCount(): number {
        return this.full._ === 'channelFull' ? this.full.stargiftsCount ?? 0 : 0
    }

    /** Whether you can enable paid messages in this chat */
    get paidMessagesAvailable(): boolean {
        return this.full._ === 'channelFull' && this.full.paidMessagesAvailable!
    }
}

memoizeGetters(FullChat, [
    'fullPhoto',
    'inviteLink',
    'location',
    'stickerSet',
    'emojiSet',
    'botInfo',
    'linkedChat',
    'recentRequesters',
    'stories',
    'botVerification',
])
makeInspectable(FullChat)
