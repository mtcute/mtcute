import { tl } from '@mtcute/tl'
import { TelegramClient } from '../../client'
import { ChatPhoto } from './chat-photo'
import { MtArgumentError } from '../errors'
import { makeInspectable } from '../utils'
import { assertTypeIs } from '../../utils/type-assertion'
import { InputMediaLike } from '../media'
import { FormattedString } from '../parser'

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

    export interface ParsedStatus {
        status: User.Status
        lastOnline: Date | null
        nextOffline: Date | null
    }
}

export class User {
    /**
     * Underlying raw TL object
     */
    readonly raw: tl.RawUser

    constructor(readonly client: TelegramClient, user: tl.TypeUser) {
        assertTypeIs('User#init', user, 'user')

        this.raw = user
    }

    /** Unique identifier for this user or bot */
    get id(): number {
        return this.raw.id
    }

    /** Whether this user is you yourself */
    get isSelf(): boolean {
        return this.raw.self!
    }

    /** Whether this user is in your contacts */
    get isContact(): boolean {
        return this.raw.contact!
    }

    /** Whether you both have each other's contact */
    get isMutualContact(): boolean {
        return this.raw.mutualContact!
    }

    /** Whether this user is deleted */
    get isDeleted(): boolean {
        return this.raw.deleted!
    }

    /** Whether this user is a bot */
    get isBot(): boolean {
        return this.raw.bot!
    }

    /** Whether this user has been verified by Telegram */
    get isVerified(): boolean {
        return this.raw.verified!
    }

    /**
     * Whether this user has been restricted. Bots only.
     * See {@link restrictionReason} for details
     */
    get isRestricted(): boolean {
        return this.raw.restricted!
    }

    /** Whether this user has been flagged for scam */
    get isScam(): boolean {
        return this.raw.scam!
    }

    /** Whether this user has been flagged for impersonation */
    get isFake(): boolean {
        return this.raw.fake!
    }

    /** Whether this user is part of the Telegram support team */
    get isSupport(): boolean {
        return this.raw.support!
    }

    /** Whether this user has Premium subscription */
    get isPremium(): boolean {
        return this.raw.premium!
    }

    /** User's or bot's first name */
    get firstName(): string {
        return this.raw.firstName ?? 'Deleted Account'
    }

    /** User's or bot's last name */
    get lastName(): string | null {
        return this.raw.lastName ?? null
    }

    static parseStatus(
        status: tl.TypeUserStatus,
        bot = false
    ): User.ParsedStatus {
        let ret: User.Status
        let date: Date

        const us = status
        if (bot) {
            ret = 'bot'
        } else if (!us) {
            ret = 'long_time_ago'
        } else
            switch (us._) {
                case 'userStatusOnline':
                    ret = 'online'
                    date = new Date(us.expires * 1000)
                    break
                case 'userStatusOffline':
                    ret = 'offline'
                    date = new Date(us.wasOnline * 1000)
                    break
                case 'userStatusRecently':
                    ret = 'recently'
                    break
                case 'userStatusLastWeek':
                    ret = 'within_week'
                    break
                case 'userStatusLastMonth':
                    ret = 'within_month'
                    break
                default:
                    ret = 'long_time_ago'
                    break
            }

        return {
            status: ret,
            lastOnline: ret === 'offline' ? date! : null,
            nextOffline: ret === 'online' ? date! : null,
        }
    }

    private _parsedStatus?: User.ParsedStatus

    private _parseStatus() {
        this._parsedStatus = User.parseStatus(this.raw.status!, this.raw.bot)
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
        return this.raw.username ?? null
    }

    /** IETF language tag of the user's language */
    get language(): string | null {
        return this.raw.langCode ?? null
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
        return (this.raw.photo as any)?.dcId ?? null
    }

    /** User's phone number */
    get phoneNumber(): string | null {
        return this.raw.phone ?? null
    }

    /**
     * Get this user's input peer for advanced use-cases.
     */
    get inputPeer(): tl.TypeInputPeer {
        if (!this.raw.accessHash)
            throw new MtArgumentError("user's access hash is not available!")

        return {
            _: 'inputPeerUser',
            userId: this.raw.id,
            accessHash: this.raw.accessHash,
        }
    }

    private _photo?: ChatPhoto
    /**
     * User's or bot's current profile photo, if any.
     * Suitable for downloads only
     */
    get photo(): ChatPhoto | null {
        if (this.raw.photo?._ !== 'userProfilePhoto') return null

        if (!this._photo) {
            this._photo = new ChatPhoto(
                this.client,
                this.inputPeer,
                this.raw.photo
            )
        }

        return this._photo
    }

    /**
     * The list of reasons why this bot might be unavailable to some users.
     * This field is available only in case *isRestricted* is `true`
     */
    get restrictions(): ReadonlyArray<tl.RawRestrictionReason> | null {
        return this.raw.restrictionReason ?? null
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
     * Otherwise, text mention is created for the given (or default) parse mode.
     *
     * Use `null` as `text` (first parameter) to force create a text
     * mention with display name, even if there is a username.
     *
     * @param text  Text of the mention.
     * @param parseMode  Parse mode to use when creating mention.
     * @example
     * ```typescript
     * msg.replyText(`Hello, ${msg.sender.mention()`)
     * ```
     */
    mention<T extends string = any>(
        text?: string | null,
        parseMode?: T | null
    ): string | FormattedString<T> {
        if (text === undefined && this.username) {
            return `@${this.username}`
        }

        if (!text) text = this.displayName
        if (!parseMode) parseMode = this.client['_defaultParseMode'] as T

        return new FormattedString(
            this.client.getParseMode(parseMode).unparse(text, [
                {
                    raw: undefined as any,
                    type: 'text_mention',
                    offset: 0,
                    length: text.length,
                    userId: this.raw.id,
                },
            ]),
            parseMode!
        )
    }

    /**
     * Create a permanent mention for this user.
     *
     * *Permanent* means that this mention will also
     * contain user's access hash, so even if the user
     * changes their username or the client forgets
     * about that user, it can still be mentioned.
     *
     * Telegram might change access hash in some cases,
     * so it may not exactly be *permanent*. The only way
     * to actually make it permanent is to send it as a message
     * somewhere and load it from there if needed.
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
    permanentMention<T extends string = any>(
        text?: string | null,
        parseMode?: T | null
    ): FormattedString<T> {
        if (!this.raw.accessHash)
            throw new MtArgumentError("user's access hash is not available!")

        if (!text) text = this.displayName
        if (!parseMode) parseMode = this.client['_defaultParseMode'] as T

        // since we are just creating a link and not actual tg entity,
        // we can use this hack to create a valid link through our parse mode
        return new FormattedString(
            this.client.getParseMode(parseMode).unparse(text, [
                {
                    raw: undefined as any,
                    type: 'text_link',
                    offset: 0,
                    length: text.length,
                    url: `tg://user?id=${
                        this.id
                    }&hash=${this.raw.accessHash.toString(16)}`,
                },
            ]),
            parseMode!
        )
    }

    /**
     * Send a text message to this user.
     *
     * @param text  Text of the message
     * @param params
     */
    sendText(
        text: string | FormattedString<any>,
        params?: Parameters<TelegramClient['sendText']>[2]
    ): ReturnType<TelegramClient['sendText']> {
        return this.client.sendText(this.inputPeer, text, params)
    }

    /**
     * Send a media to this user.
     *
     * @param media  Media to send
     * @param params
     */
    sendMedia(
        media: InputMediaLike | string,
        params?: Parameters<TelegramClient['sendMedia']>[2]
    ): ReturnType<TelegramClient['sendMedia']> {
        return this.client.sendMedia(this.inputPeer, media, params)
    }

    /**
     * Send a media group to this user.
     *
     * @param medias  Medias to send
     * @param params
     */
    sendMediaGroup(
        medias: (InputMediaLike | string)[],
        params?: Parameters<TelegramClient['sendMediaGroup']>[2]
    ): ReturnType<TelegramClient['sendMediaGroup']> {
        return this.client.sendMediaGroup(this.inputPeer, medias, params)
    }
}

makeInspectable(User)
