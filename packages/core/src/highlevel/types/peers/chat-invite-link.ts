import { tl } from '@mtcute/tl'

import { assertTypeIsNot } from '../../../utils/type-assertions.js'
import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { PeersIndex } from './index.js'
import { User } from './user.js'

/**
 * An invite link
 */
export class ChatInviteLink {
    readonly raw: tl.RawChatInviteExported

    constructor(
        raw: tl.TypeExportedChatInvite,
        readonly _peers?: PeersIndex,
    ) {
        assertTypeIsNot('ChatInviteLink', raw, 'chatInvitePublicJoinRequests')

        this.raw = raw
    }

    /**
     * The invite link as a `t.me/joinchat/` string.
     *
     * If the link was created by another administrator, the second
     * part of the link will be censored with `...` (e.g. `https://t.me/joinchat/BGxxHIg4...`
     *
     * See also: {@link isMyLink}
     */
    get link(): string {
        return this.raw.link
    }

    /**
     * Whether this invite link was created by the current user.
     *
     * If so, {@link link} will be a full invite link.
     */
    get isMyLink(): boolean {
        return this.creator?.isSelf ?? !this.raw.link.endsWith('...')
    }

    /**
     * Creator of the invite link, if available
     */
    get creator(): User | null {
        if (!this._peers) return null

        return new User(this._peers.user(this.raw.adminId))
    }

    /**
     * Creation date of the link
     */
    get date(): Date {
        return new Date(this.raw.date * 1000)
    }

    /**
     * Whether this link is primary (i.e. "permanent")
     */
    get isPrimary(): boolean {
        return this.raw.permanent!
    }

    /**
     * Whether this link was revoked and can't be used anymore
     */
    get isRevoked(): boolean {
        return this.raw.revoked!
    }

    /**
     * The date since which the link will be valid (if any)
     */
    get startDate(): Date | null {
        return this.raw.startDate ? new Date(this.raw.startDate * 1000) : null
    }

    /**
     * The date until which the link will be valid (if any)
     */
    get endDate(): Date | null {
        return this.raw.expireDate ? new Date(this.raw.expireDate * 1000) : null
    }

    /**
     * Maximum number of users that can be members of this chat
     * at the same time after joining using this link.
     *
     * Integer in range `[1, 99999]` or `Infinity` if unspecified
     */
    get usageLimit(): number {
        return this.raw.usageLimit ?? Infinity
    }

    /**
     * Number of users currently in the chat that joined using this link
     */
    get usage(): number {
        return this.raw.usage ?? 0
    }

    /**
     * Whether users joined by this link need to be
     * approved by the group administrator before they can join
     */
    get approvalNeeded(): boolean {
        return this.raw.requestNeeded!
    }

    /**
     * Number of users currently awaiting admin approval.
     *
     * 0 in case the link is not using approvals
     */
    get pendingApprovals(): number {
        return this.raw.requested ?? 0
    }
}

memoizeGetters(ChatInviteLink, ['creator'])
makeInspectable(ChatInviteLink)
