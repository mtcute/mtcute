import { tl } from '@mtcute/tl'

import { MtTypeAssertionError } from '../../../types/errors.js'
import { makeInspectable } from '../../utils/inspectable.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { Photo } from '../media/photo.js'
import { Chat } from './chat.js'
import { ChatLocation } from './chat-location.js'

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
        if (full._ === 'users.userFull') {
            const user = full.users.find((it) => it.id === full.fullUser.id)

            if (!user || user._ === 'userEmpty') {
                throw new MtTypeAssertionError('Chat._parseFull', 'user', user?._ ?? 'undefined')
            }

            return new FullChat(user, full.fullUser)
        }

        const fullChat = full.fullChat
        let chat: tl.TypeChat | undefined = undefined
        let linked: tl.TypeChat | undefined = undefined

        for (const c of full.chats) {
            if (fullChat.id === c.id) {
                chat = c
            }
            if (fullChat._ === 'channelFull' && fullChat.linkedChatId === c.id) {
                linked = c
            }
        }

        const ret = new FullChat(chat!, fullChat)
        ret._linkedChat = linked ? new Chat(linked) : undefined

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
     * Chat's permanent invite link, for groups, supergroups and channels.
     */
    get inviteLink(): string | null {
        if (this.fullPeer && this.fullPeer._ !== 'userFull') {
            switch (this.fullPeer.exportedInvite?._) {
                case 'chatInvitePublicJoinRequests':
                    return null
                case 'chatInviteExported':
                    return this.fullPeer.exportedInvite.link
            }
        }

        return null
    }

    /**
     * For supergroups, name of the group sticker set.
     */
    get stickerSetName(): string | null {
        return this.fullPeer && this.fullPeer._ === 'channelFull' ? this.fullPeer.stickerset?.shortName ?? null : null
    }

    /**
     * Whether the group sticker set can be changed by you.
     */
    get canSetStickerSet(): boolean | null {
        return this.fullPeer && this.fullPeer._ === 'channelFull' ? this.fullPeer.canSetStickers ?? null : null
    }

    /**
     * Chat members count, for groups, supergroups and channels only.
     */
    get membersCount(): number | null {
        if (this.fullPeer && this.fullPeer._ !== 'userFull') {
            if (this.fullPeer._ === 'chatFull' && this.fullPeer.participants._ === 'chatParticipants') {
                return this.fullPeer.participants.participants.length
            } else if (this.fullPeer._ === 'channelFull') {
                return this.fullPeer.participantsCount ?? null
            }
        }

        return null
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
     * The linked discussion group (in case of channels)
     * or the linked channel (in case of supergroups).
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
}

memoizeGetters(FullChat, ['fullPhoto', 'personalPhoto', 'realPhoto', 'publicPhoto', 'location'])
makeInspectable(FullChat)
