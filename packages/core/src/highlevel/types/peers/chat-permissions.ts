import { tl } from '@mtcute/tl'

import { makeInspectable } from '../../utils/index.js'

/**
 * Represents the permissions of a user in a {@link Chat}.
 */
export class ChatPermissions {
    readonly raw: tl.RawChatBannedRights

    constructor(bannedRights: tl.RawChatBannedRights) {
        this.raw = bannedRights
    }

    /**
     * Whether users can view messages
     */
    get canViewMessages(): boolean {
        return !this.raw.viewMessages
    }

    /**
     * Whether users can send text messages,
     * contacts, locations and venues
     */
    get canSendMessages(): boolean {
        return !this.raw.sendMessages
    }

    /**
     * Whether users can send media messages,
     * including documents, photos, videos, video notes and voice notes.
     *
     * Implies {@link canSendMessages}
     */
    get canSendMedia(): boolean {
        return !this.raw.sendMedia
    }

    /**
     * Whether users can send stickers.
     *
     * Implies {@link canSendMedia}
     */
    get canSendStickers(): boolean {
        return !this.raw.sendStickers
    }

    /**
     * Whether users can send GIFs.
     *
     * Implies {@link canSendMedia}
     */
    get canSendGifs(): boolean {
        return !this.raw.sendGifs
    }

    /**
     * Whether users can send photos.
     *
     * Implies {@link canSendMedia}
     */
    get canSendPhotos(): boolean {
        return !this.raw.sendPhotos
    }

    /**
     * Whether users can send videos.
     *
     * Implies {@link canSendMedia}
     */
    get canSendVideos(): boolean {
        return !this.raw.sendVideos
    }

    /**
     * Whether users can send round videos (i.e. video notes).
     *
     * Implies {@link canSendMedia}
     */
    get canSendRoundVideos(): boolean {
        return !this.raw.sendRoundvideos
    }

    /**
     * Whether users can send audio files.
     *
     * Implies {@link canSendMedia}
     */
    get canSendAudios(): boolean {
        return !this.raw.sendAudios
    }

    /**
     * Whether users can send voice notes.
     *
     * Implies {@link canSendMedia}
     */
    get canSendVoices(): boolean {
        return !this.raw.sendVoices
    }

    /**
     * Whether users can send files.
     *
     * Implies {@link canSendMedia}
     */
    get canSendFiles(): boolean {
        return !this.raw.sendDocs
    }

    /**
     * Whether users can send games.
     *
     * Implies {@link canSendMedia}
     */
    get canSendGames(): boolean {
        return !this.raw.sendGames
    }

    /**
     * Whether users can use inline bots.
     *
     * Implies {@link canSendMedia}
     */
    get canUseInline(): boolean {
        return !this.raw.sendInline
    }

    /**
     * Whether users can use inline bots.
     *
     * Implies {@link canSendMedia}
     */
    get canAddWebPreviews(): boolean {
        return !this.raw.embedLinks
    }

    /**
     * Whether users can send text messages.
     *
     * Implies {@link canSendMessages}
     */
    get canSendText(): boolean {
        return !this.raw.sendPlain
    }

    /**
     * Whether users can send polls.
     *
     * Implies {@link canSendMessages}
     */
    get canSendPolls(): boolean {
        return !this.raw.sendPolls
    }

    /**
     * Whether users can change the chat title,
     * photo and other settings.
     */
    get canChangeInfo(): boolean {
        return !this.raw.changeInfo
    }

    /**
     * Whether users can invite other users to the chat
     */
    get canInviteUsers(): boolean {
        return !this.raw.inviteUsers
    }

    /**
     * Whether users can pin messages
     */
    get canPinMessages(): boolean {
        return !this.raw.pinMessages
    }

    /**
     * Whether users can pin messages
     */
    get canManageTopics(): boolean {
        return !this.raw.manageTopics
    }

    /**
     * UNIX date until which these permissions are valid,
     * or `null` if forever.
     *
     * For example, represents the time when the restrictions
     * will be lifted from a {@link ChatMember}
     */
    get untilDate(): Date | null {
        return this.raw.untilDate === 0 ? null : new Date(this.raw.untilDate * 1000)
    }
}

makeInspectable(ChatPermissions)
