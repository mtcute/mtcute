import { tl } from '@mtcute/tl'

import { makeInspectable } from '../utils'

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

/**
 * Chat permissions that are used as an input for API methods.
 */
export type InputChatPermissions = {
    [k in Exclude<keyof ChatPermissions, '_bannedRights'>]?: boolean
}
