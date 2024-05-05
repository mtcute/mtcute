import { tl } from '@mtcute/tl'

import { MtTypeAssertionError } from '../../../types/errors.js'
import { makeInspectable } from '../../utils/inspectable.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { Photo } from '../media/photo.js'
import { StickerSet } from '../misc/sticker-set.js'
import { BusinessAccount } from '../premium/business-account.js'
import { Chat } from './chat.js'
import { ChatInviteLink } from './chat-invite-link.js'
import { ChatLocation } from './chat-location.js'
import { PeersIndex } from './peers-index.js'

/**
 * Complete information about a particular chat.
 */
export class FullChat extends Chat {
    constructor(
        peer: tl.TypeUser | tl.TypeChat,
        readonly fullPeer: tl.TypeUserFull | tl.TypeChatFull,
    ) {
        super(peer)
    }

    /** @internal */
    static _parse(full: tl.messages.RawChatFull | tl.users.TypeUserFull): FullChat {
        const peers = PeersIndex.from(full)

        if (full._ === 'users.userFull') {
            const { fullUser } = full
            const user = peers.user(full.fullUser.id)

            if (!user || user._ === 'userEmpty') {
                throw new MtTypeAssertionError('Chat._parseFull', 'user', user?._ ?? 'undefined')
            }

            const ret = new FullChat(user, fullUser)

            if (fullUser.personalChannelId) {
                ret._linkedChat = new Chat(peers.chat(fullUser.personalChannelId))
            }

            return ret
        }

        const { fullChat } = full

        const ret = new FullChat(peers.chat(fullChat.id), fullChat)

        if (fullChat._ === 'channelFull' && fullChat.linkedChatId) {
            ret._linkedChat = new Chat(peers.chat(fullChat.linkedChatId))
        }

        return ret
    }

    /**
     * Whether this chat (user) has restricted sending them voice/video messages.
     */
    get hasBlockedVoices(): boolean {
        return this.fullPeer?._ === 'userFull' && this.fullPeer.voiceMessagesForbidden!
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
        if (!this.fullPeer) return null

        let photo: tl.TypePhoto | undefined = undefined

        switch (this.fullPeer._) {
            case 'userFull':
                photo = this.fullPeer.personalPhoto ?? this.fullPeer.profilePhoto ?? this.fullPeer.fallbackPhoto
                break
            case 'chatFull':
            case 'channelFull':
                photo = this.fullPeer.chatPhoto
        }

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
        if (!this.fullPeer || this.fullPeer._ !== 'userFull') return null
        if (this.fullPeer.personalPhoto?._ !== 'photo') return null

        return new Photo(this.fullPeer.personalPhoto)
    }

    /**
     * Actual profile photo of the user, bypassing the custom one.
     */
    get realPhoto(): Photo | null {
        if (!this.fullPeer) return null
        if (this.fullPeer._ !== 'userFull') return this.fullPhoto
        if (this.fullPeer.personalPhoto?._ !== 'photo') return null

        return new Photo(this.fullPeer.personalPhoto)
    }

    /**
     * A photo that the user has set to be shown
     * in case their actual profile photo is not available
     * due to privacy settings.
     *
     * Currently only available for users.
     */
    get publicPhoto(): Photo | null {
        if (!this.fullPeer || this.fullPeer._ !== 'userFull') return null
        if (this.fullPeer.fallbackPhoto?._ !== 'photo') return null

        return new Photo(this.fullPeer.fallbackPhoto)
    }

    /**
     * Bio of the other party in a private chat, or description of a
     * group, supergroup or channel.
     */
    get bio(): string | null {
        return this.fullPeer?.about ?? null
    }

    /**
     * Chat's primary invite link, for groups, supergroups and channels.
     */
    get inviteLink(): ChatInviteLink | null {
        if (this.fullPeer && this.fullPeer._ !== 'userFull') {
            switch (this.fullPeer.exportedInvite?._) {
                case 'chatInvitePublicJoinRequests':
                    return null
                case 'chatInviteExported':
                    return new ChatInviteLink(this.fullPeer.exportedInvite)
            }
        }

        return null
    }

    /**
     * For supergroups, information about the group sticker set.
     */
    get stickerSet(): StickerSet | null {
        if (this.fullPeer?._ !== 'channelFull' || !this.fullPeer.stickerset) return null

        return new StickerSet(this.fullPeer.stickerset)
    }

    /**
     * For supergroups, information about the group emoji set.
     */
    get emojiSet(): StickerSet | null {
        if (this.fullPeer?._ !== 'channelFull' || !this.fullPeer.emojiset) return null

        return new StickerSet(this.fullPeer.emojiset)
    }

    /**
     * Whether the group sticker set can be changed by you.
     */
    get canSetStickerSet(): boolean | null {
        return this.fullPeer && this.fullPeer._ === 'channelFull' ? this.fullPeer.canSetStickers ?? null : null
    }

    /**
     * Number of boosts applied by the current user to this chat.
     */
    get boostsApplied(): number {
        if (!this.fullPeer || this.fullPeer._ !== 'channelFull') return 0

        return this.fullPeer?.boostsApplied ?? 0
    }

    /**
     * Number of boosts required for the user to be unrestricted in this chat.
     */
    get boostsForUnrestrict(): number {
        if (!this.fullPeer || this.fullPeer._ !== 'channelFull') return 0

        return this.fullPeer?.boostsUnrestrict ?? 0
    }

    /**
     * Chat members count, for groups, supergroups and channels only.
     */
    get membersCount(): number | null {
        switch (this.fullPeer._) {
            case 'userFull':
                return null
            case 'chatFull':
                if (this.fullPeer.participants._ !== 'chatParticipants') {
                    return null
                }

                return this.fullPeer.participants.participants.length
            case 'channelFull':
                return this.fullPeer.participantsCount ?? null
        }
    }

    /**
     * Location of the chat.
     */
    get location(): ChatLocation | null {
        if (!this.fullPeer || this.fullPeer._ !== 'channelFull' || this.fullPeer.location?._ !== 'channelLocation') {
            return null
        }

        return new ChatLocation(this.fullPeer.location)
    }

    private _linkedChat?: Chat
    /**
     * Information about a linked chat:
     * - for channels: the discussion group
     * - for supergroups: the linked channel
     * - for users: the personal channel
     */
    get linkedChat(): Chat | null {
        return this._linkedChat ?? null
    }

    /**
     * TTL of all messages in this chat, in seconds
     */
    get ttlPeriod(): number | null {
        return this.fullPeer?.ttlPeriod ?? null
    }

    /**
     * If this is a business account, information about the business.
     */
    get business(): BusinessAccount | null {
        if (!this.fullPeer || this.fullPeer._ !== 'userFull') return null

        return new BusinessAccount(this.fullPeer)
    }
}

memoizeGetters(FullChat, [
    'fullPhoto',
    'personalPhoto',
    'realPhoto',
    'publicPhoto',
    'location',
    'stickerSet',
    'emojiSet',
    'business',
])
makeInspectable(FullChat)
