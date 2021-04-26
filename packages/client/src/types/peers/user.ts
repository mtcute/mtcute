import { tl } from '@mtcute/tl'
import { TelegramClient } from '../../client'
import { ChatPhoto } from './chat-photo'
import { MtCuteArgumentError } from '../errors'
import { makeInspectable } from '../utils'
import { assertTypeIs } from '../../utils/type-assertion'

export namespace User {
    /**
     * User's Last Seen & Online status.
     * Can be one of the following:
     *  - `online`, user is online right now.
     *  - `offline`, user is currently offline.
     *  - `recently`, user with hidden last seen time who was online between 1 second and 2-3 days ago.
     *  - `within_week`, user with hidden last seen time who was online between 2-3 and seven days ago.
     *  - `within_month`, user with hidden last seen time who was online between 6-7 days and a month ago.
     *  - `long_time_ago`, blocked user or user with hidden last seen time who was online more than a month ago.
     *  - `bot`, for bots.
     */
    export type Status =
        | 'online'
        | 'offline'
        | 'recently'
        | 'within_week'
        | 'within_month'
        | 'long_time_ago'
        | 'bot'
}

interface ParsedStatus {
    status: User.Status
    lastOnline: Date | null
    nextOffline: Date | null
}

export class User {
    /** Client that this user belongs to */
    readonly client: TelegramClient

    /**
     * Underlying raw TL object
     */
    private _user: tl.RawUser

    constructor(client: TelegramClient, user: tl.TypeUser) {
        assertTypeIs('User#init', user, 'user')

        this.client = client
        this._user = user
    }

    /** Unique identifier for this user or bot */
    get id(): number {
        return this._user.id
    }

    /** Whether this user is you yourself */
    get isSelf(): boolean {
        return this._user.self!
    }

    /** Whether this user is in your contacts */
    get isContact(): boolean {
        return this._user.contact!
    }

    /** Whether you both have each other's contact */
    get isMutualContact(): boolean {
        return this._user.mutualContact!
    }

    /** Whether this user is deleted */
    get isDeleted(): boolean {
        return this._user.deleted!
    }

    /** Whether this user is a bot */
    get isBot(): boolean {
        return this._user.bot!
    }

    /** Whether this user has been verified by Telegram */
    get isVerified(): boolean {
        return this._user.verified!
    }

    /**
     * Whether this user has been restricted. Bots only.
     * See {@link restrictionReason} for details
     */
    get isRestricted(): boolean {
        return this._user.restricted!
    }

    /** Whether this user has been flagged for scam */
    get isScam(): boolean {
        return this._user.scam!
    }

    /** Whether this user has been flagged for impersonation */
    get isFake(): boolean {
        return this._user.fake!
    }

    /** Whether this user is part of the Telegram support team */
    get isSupport(): boolean {
        return this._user.support!
    }

    /** User's or bot's first name */
    get firstName(): string {
        return this._user.firstName ?? 'Deleted Account'
    }

    /** User's or bot's last name */
    get lastName(): string | null {
        return this._user.lastName ?? null
    }

    private _parsedStatus?: ParsedStatus

    private _parseStatus() {
        let status: User.Status
        let date: Date

        const us = this._user.status
        if (!us) {
            status = 'long_time_ago'
        } else if (this._user.bot) {
            status = 'bot'
        } else if (us._ === 'userStatusOnline') {
            status = 'online'
            date = new Date(us.expires * 1000)
        } else if (us._ === 'userStatusOffline') {
            status = 'offline'
            date = new Date(us.wasOnline * 1000)
        } else if (us._ === 'userStatusRecently') {
            status = 'recently'
        } else if (us._ === 'userStatusLastWeek') {
            status = 'within_week'
        } else if (us._ === 'userStatusLastMonth') {
            status = 'within_month'
        } else {
            status = 'long_time_ago'
        }

        this._parsedStatus = {
            status,
            lastOnline: status === 'offline' ? date! : null,
            nextOffline: status === 'online' ? date! : null,
        }
    }

    /** User's Last Seen & Online status */
    get status(): User.Status {
        if (!this._parsedStatus) this._parseStatus()
        return this._parsedStatus!.status
    }

    /**
     * Last time this user was seen online.
     * Only available if {@link status} is `offline`
     */
    get lastOnline(): Date | null {
        if (!this._parsedStatus) this._parseStatus()
        return this._parsedStatus!.lastOnline
    }

    /**
     * Time when this user will automatically go offline.
     * Only available if {@link status} is `online`
     */
    get nextOffline(): Date | null {
        if (!this._parsedStatus) this._parseStatus()
        return this._parsedStatus!.nextOffline
    }

    /** User's or bot's username */
    get username(): string | null {
        return this._user.username ?? null
    }

    /** IETF language tag of the user's language */
    get language(): string | null {
        return this._user.langCode ?? null
    }

    /**
     * User's or bot's assigned DC (data center).
     * Available only in case the user has set a public profile photo.
     *
     * **Note**: this information is approximate; it is based on where
     * Telegram stores a user profile pictures and does not by any means tell
     * you the user location (i.e. a user might travel far away, but will still connect
     * to its assigned DC).
     * More info at [Pyrogram FAQ](https://docs.pyrogram.org/faq#what-are-the-ip-addresses-of-telegram-data-centers).
     */
    get dcId(): number | null {
        return (this._user.photo as any)?.dcId ?? null
    }

    /** User's phone number */
    get phoneNumber(): string | null {
        return this._user.phone ?? null
    }

    /**
     * Get this user's input peer for advanced use-cases.
     */
    get inputPeer(): tl.TypeInputPeer {
        if (!this._user.accessHash)
            throw new MtCuteArgumentError(
                "user's access hash is not available!"
            )

        return {
            _: 'inputPeerUser',
            userId: this._user.id,
            accessHash: this._user.accessHash,
        }
    }

    private _photo?: ChatPhoto
    /**
     * User's or bot's current profile photo, if any.
     * Suitable for downloads only
     */
    get photo(): ChatPhoto | null {
        if (this._user.photo?._ !== 'userProfilePhoto') return null

        if (!this._photo) {
            this._photo = new ChatPhoto(
                this.client,
                this.inputPeer,
                this._user.photo
            )
        }

        return this._photo
    }

    /**
     * The list of reasons why this bot might be unavailable to some users.
     * This field is available only in case *isRestricted* is `true`
     */
    get restrictions(): tl.RawRestrictionReason[] | null {
        return this._user.restrictionReason ?? null
    }

    /**
     * User's display name.
     *
     * First name and last name if available,
     * only first name otherwise.
     */
    get displayName(): string {
        if (!this.firstName) return 'Deleted Account'
        if (this.lastName) return `${this.firstName} ${this.lastName}`
        return this.firstName
    }

    /**
     * Create a mention for the user.
     *
     * When available and `text` is omitted, this method will return `@username`.
     * Otherwise, text mention is created for the given (or default) parse mode
     *
     * @param text  Text of the mention.
     * @param parseMode  Parse mode to use when creating mention.
     * @example
     * ```typescript
     * msg.replyText(`Hello, ${msg.sender.mention()`)
     * ```
     */
    mention(text?: string | null, parseMode?: string | null): string {
        if (!text && this.username) {
            return `@${this.username}`
        }

        if (!text) text = this.displayName
        if (!parseMode) parseMode = this.client['_defaultParseMode']

        return this.client.getParseMode(parseMode).unparse(text, [
            {
                raw: undefined as any,
                type: 'text_mention',
                offset: 0,
                length: text.length,
                userId: this.id,
            },
        ])
    }

    /**
     * Create a permanent mention for this user.
     *
     * *Permanent* means that this mention will also
     * contain user's access hash, so even if the user
     * changes their username or the client forgets
     * about that user, it can still be mentioned.
     *
     * This method is only needed when the result will be
     * stored somewhere outside current MTCute instance,
     * otherwise {@link mention} will be enough.
     *
     * > **Note**: the resulting text can only be used by clients
     * > that support MTCute notation of permanent
     * > mention links (`tg://user?id=123&hash=abc`).
     * >
     * > Both `@mtcute/html-parser` and `@mtcute/markdown-parser` support it.
     * >
     * > Also note that these permanent mentions are only
     * > valid for current account, since peer access hashes are
     * > account-specific and can't be used on another account.
     *
     * @param text  Mention text
     * @param parseMode  Parse mode to use when creating mention
     */
    permanentMention(text?: string | null, parseMode?: string | null): string {
        if (!this._user.accessHash)
            throw new MtCuteArgumentError(
                "user's access hash is not available!"
            )

        if (!text) text = this.displayName
        if (!parseMode) parseMode = this.client['_defaultParseMode']

        // since we are just creating a link and not actual tg entity,
        // we can use this hack to create a valid link through our parse mode
        return this.client.getParseMode(parseMode).unparse(text, [
            {
                raw: undefined as any,
                type: 'text_link',
                offset: 0,
                length: text.length,
                url: `tg://user?id=${
                    this.id
                }&hash=${this._user.accessHash.toString(16)}`,
            },
        ])
    }
}

makeInspectable(User)
