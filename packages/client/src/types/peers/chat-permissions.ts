import { tl } from '@mtcute/tl'
import { makeInspectable } from '../utils'

/**
 * Represents the rights of a normal user in a {@link Chat}.
 */
export class ChatPermissions {
    readonly _bannedRights: tl.RawChatBannedRights

    constructor(bannedRights: tl.RawChatBannedRights) {
        this._bannedRights = bannedRights
    }

    /**
     * Whether users can view messages
     */
    get canViewMessages(): boolean {
        return !this._bannedRights.viewMessages
    }

    /**
     * Whether users can send text messages,
     * contacts, locations and venues
     */
    get canSendMessages(): boolean {
        return !this._bannedRights.sendMessages
    }

    /**
     * Whether users can send media messages,
     * including documents, photos, videos, video notes and voice notes.
     *
     * Implies {@link canSendMessages}
     */
    get canSendMedia(): boolean {
        return !this._bannedRights.sendMedia
    }

    /**
     * Whether users can send stickers.
     *
     * Implies {@link canSendMedia}
     */
    get canSendStickers(): boolean {
        return !this._bannedRights.sendStickers
    }

    /**
     * Whether users can send GIFs.
     *
     * Implies {@link canSendMedia}
     */
    get canSendGifs(): boolean {
        return !this._bannedRights.sendGifs
    }

    /**
     * Whether users can send games.
     *
     * Implies {@link canSendMedia}
     */
    get canSendGames(): boolean {
        return !this._bannedRights.sendGames
    }

    /**
     * Whether users can use inline bots.
     *
     * Implies {@link canSendMedia}
     */
    get canUseInline(): boolean {
        return !this._bannedRights.sendInline
    }

    /**
     * Whether users can use inline bots.
     *
     * Implies {@link canSendMedia}
     */
    get canAddWebPreviews(): boolean {
        return !this._bannedRights.embedLinks
    }

    /**
     * Whether users can send polls.
     *
     * Implies {@link canSendMessages}
     */
    get canSendPolls(): boolean {
        return !this._bannedRights.sendPolls
    }

    /**
     * Whether users can change the chat title,
     * photo and other settings.
     */
    get canChangeInfo(): boolean {
        return !this._bannedRights.changeInfo
    }

    /**
     * Whether users can invite other users to the chat
     */
    get canInviteUsers(): boolean {
        return !this._bannedRights.inviteUsers
    }

    /**
     * Whether users can pin messages
     */
    get canPinMessages(): boolean {
        return !this._bannedRights.pinMessages
    }

    /**
     * UNIX date until which these permissions are valid,
     * or `null` if forever.
     */
    get untilDate(): Date | null {
        return this._bannedRights.untilDate === 0
            ? null
            : new Date(this._bannedRights.untilDate * 1000)
    }
}

makeInspectable(ChatPermissions)
