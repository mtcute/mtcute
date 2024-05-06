import { tl } from '@mtcute/tl'

import { MtArgumentError } from '../../../types/errors.js'
import { assertTypeIs } from '../../../utils/type-assertions.js'
import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { MessageEntity } from '../messages/message-entity.js'
import { EmojiStatus } from '../reactions/emoji-status.js'
import { ChatColors } from './chat-colors.js'
import { ChatPhoto } from './chat-photo.js'

/**
 * User's Last Seen & Online status.
 * Can be one of the following:
 *  - `online`, user is online right now.
 *  - `offline`, user is currently offline.
 *  - `recently`, user with hidden last seen time who was online between 1 second and 72 hours ago.
 *  - `within_week`, user with hidden last seen time who was online between 72 hours and 7 days ago.
 *  - `within_month`, user with hidden last seen time who was online between 7 days and a month ago.
 *  - `long_time_ago`, blocked user or user with hidden last seen time who was online more than a month ago.
 *  - `bot`, for bots.
 */
export type UserStatus = 'online' | 'offline' | 'recently' | 'within_week' | 'within_month' | 'long_time_ago' | 'bot'

export interface UserParsedStatus {
    status: UserStatus
    lastOnline: Date | null
    nextOffline: Date | null
    byMe: boolean
}

export class User {
    readonly type = 'user' as const

    /**
     * Underlying raw TL object
     */
    readonly raw: tl.RawUser

    constructor(user: tl.TypeUser) {
        assertTypeIs('User#init', user, 'user')

        this.raw = user
    }

    /** Unique identifier for this user or bot */
    get id(): number {
        return this.raw.id
    }

    /**
     * Whether this user's information is incomplete.
     *
     * This usually only happens in large chats, where
     * the server sometimes sends only a part of the user's
     * information. Basic info like name and profile photo
     * are always available, but other fields may be omitted
     * despite being available.
     *
     * It was observed that these fields may be missing:
     *   - `username, usernames`
     *   - `status, lastOnline, nextOffline`
     *   - `storiesMaxId`
     *   - `photo` - in some cases when user has some some privacy settings
     *   - and probably more
     *
     * This currently only ever happens for non-bot users, so if you are building
     * a normal bot, you can safely ignore this field.
     *
     * To fetch the "complete" user information, use one of these methods:
     *  - {@link TelegramClient.getUsers}
     *  - {@link TelegramClient.getChat}
     *  - {@link TelegramClient.getFullChat}.
     *
     * Learn more: [Incomplete peers](https://mtcute.dev/guide/topics/peers.html#incomplete-peers)
     */
    get isMin(): boolean {
        return this.raw.min!
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

    /** Whether this user is in yout "close friends" list */
    get isCloseFriend(): boolean {
        return this.raw.closeFriend!
    }

    /** Whether this user is deleted */
    get isDeleted(): boolean {
        return this.raw.deleted!
    }

    /** Whether this user is a bot */
    get isBot(): boolean {
        return this.raw.bot!
    }

    /**
     * Whether this user is a bot that can be connected to a
     * Telegram Business account to receive its messages
     */
    get isBusinessBot(): boolean {
        return this.raw.botBusiness!
    }

    /** Whether this user is a bot that has access to all messages */
    get isBotWithHistory(): boolean {
        return this.raw.botChatHistory!
    }

    /** Whether this user is a bot that can't be added to chats */
    get isBotWithoutChats(): boolean {
        return this.raw.botNochats!
    }

    /** Whether this bot offers an attachment menu web app */
    get isBotWithAttachmentMenu(): boolean {
        return this.raw.botAttachMenu!
    }

    /** Whether this bot can be edited by the current user */
    get isBotEditable(): boolean {
        return this.raw.botCanEdit!
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

    /**
     * Reason why this bot was restricted
     */
    get restrictionReason(): tl.TypeRestrictionReason[] {
        return this.raw.restrictionReason ?? []
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

    /** Whether Premium is required to contact this user */
    get isPremiumRequired(): boolean {
        return this.raw.contactRequirePremium!
    }

    /** User's or bot's first name */
    get firstName(): string {
        return this.raw.firstName ?? 'Deleted Account'
    }

    /** User's or bot's last name */
    get lastName(): string | null {
        return this.raw.lastName ?? null
    }

    static parseStatus(status?: tl.TypeUserStatus, bot = false): UserParsedStatus {
        let ret: UserStatus
        let date: Date
        let byMe = false

        const us = status

        if (bot) {
            ret = 'bot'
        } else if (!us) {
            ret = 'long_time_ago'
        } else {
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
                    byMe = us.byMe!
                    break
                case 'userStatusLastWeek':
                    ret = 'within_week'
                    byMe = us.byMe!
                    break
                case 'userStatusLastMonth':
                    ret = 'within_month'
                    byMe = us.byMe!
                    break
                default:
                    ret = 'long_time_ago'
                    break
            }
        }

        return {
            status: ret,
            lastOnline: ret === 'offline' ? date! : null,
            nextOffline: ret === 'online' ? date! : null,
            byMe,
        }
    }

    private get _parsedStatus() {
        return User.parseStatus(this.raw.status, this.raw.bot)
    }

    /** User's Last Seen & Online status */
    get status(): UserStatus {
        return this._parsedStatus.status
    }

    /**
     * Whether user's online status is hidden because
     * we have hidden our own online status from them,
     * and we don't have Premium subscription.
     */
    get statusHiddenByMe(): boolean {
        return this._parsedStatus.byMe
    }

    /**
     * Last time this user was seen online.
     * Only available if {@link status} is `offline`
     */
    get lastOnline(): Date | null {
        return this._parsedStatus.lastOnline
    }

    /**
     * Time when this user will automatically go offline.
     * Only available if {@link status} is `online`
     */
    get nextOffline(): Date | null {
        return this._parsedStatus.nextOffline
    }

    /** User's or bot's username */
    get username(): string | null {
        return this.raw.username ?? this.raw.usernames?.[0]?.username ?? null
    }

    /** User's or bot's usernames (including collectibles) */
    get usernames(): ReadonlyArray<tl.RawUsername> | null {
        if (this.raw.username) {
            return [{ _: 'username', username: this.raw.username, active: true }]
        }

        if (!this.raw.usernames?.length) {
            return null
        }

        return this.raw.usernames
    }

    /**
     * IETF language tag of the user's language
     *
     * Only available in some contexts
     */
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
        return (this.raw.photo as Exclude<typeof this.raw.photo, tl.RawUserProfilePhotoEmpty>)?.dcId ?? null
    }

    /** User's phone number */
    get phoneNumber(): string | null {
        return this.raw.phone ?? null
    }

    /**
     * Get this user's input peer for advanced use-cases.
     *
     * > **Note**: for {@link min} users, this method will return
     * > `mtcute.dummyInputPeerMinUser`, which is actually not a valid input peer.
     * > These are used to indicate that the user is incomplete, and a message
     * > reference is needed to resolve the peer.
     * >
     * > Such objects are handled by {@link TelegramClient.resolvePeer} method,
     * > so prefer using it whenever you need an input peer.
     */
    get inputPeer(): tl.TypeInputPeer {
        if (this.raw.min) {
            return {
                _: 'mtcute.dummyInputPeerMinUser',
                userId: this.raw.id,
            }
        }

        if (!this.raw.accessHash) {
            throw new MtArgumentError("user's access hash is not available!")
        }

        return {
            _: 'inputPeerUser',
            userId: this.raw.id,
            accessHash: this.raw.accessHash,
        }
    }

    /**
     * User's or bot's current profile photo, if any.
     * Suitable for downloads only
     */
    get photo(): ChatPhoto | null {
        if (this.raw.photo?._ !== 'userProfilePhoto') return null

        return new ChatPhoto(this.inputPeer, this.raw.photo)
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
     * User's emoji status, if any.
     */
    get emojiStatus(): EmojiStatus | null {
        if (!this.raw.emojiStatus || this.raw.emojiStatus._ === 'emojiStatusEmpty') return null

        return new EmojiStatus(this.raw.emojiStatus)
    }

    /** Whether you have hidden (arhived) this user's stories */
    get storiesHidden(): boolean {
        return this.raw.storiesHidden!
    }

    get storiesUnavailable(): boolean {
        return this.raw.storiesUnavailable!
    }

    /**
     * Maximum ID of stories this user has (or 0 if none)
     */
    get storiesMaxId(): number {
        return this.raw.storiesMaxId ?? 0
    }

    /**
     * Color that should be used when rendering replies to
     * their messages and web previews sent by them,
     * as well as to render the chat title
     */
    get color(): ChatColors {
        return new ChatColors(this.raw.id, this.raw.color)
    }

    /**
     * Color that should be used when rendering the header of
     * the user's profile
     *
     * If `null`, a generic header should be used instead
     */
    get profileColors(): ChatColors | null {
        return this.raw.profileColor ? new ChatColors(this.raw.id, this.raw.profileColor) : null
    }

    /**
     * Create a mention for the user.
     *
     * When available and `text` is omitted, this method will return `@username`.
     * Otherwise, text mention is created.
     *
     * Use `null` as `text` (first parameter) to force create a text
     * mention with display name, even if there is a username.
     *
     * > **Note**: This method doesn't format anything on its own.
     * > Instead, it returns a {@link MessageEntity} that can later
     * > be used with `html` or `md` template tags
     *
     * @param text  Text of the mention.
     * @example
     * ```typescript
     * msg.replyText(html`Hello, ${msg.sender.mention()`)
     * ```
     */
    mention(text?: string | null): string | MessageEntity {
        if (text === undefined && this.username) {
            return `@${this.username}`
        }

        if (!text) text = this.displayName

        return new MessageEntity(
            {
                _: 'messageEntityMentionName',
                offset: 0,
                length: text.length,
                userId: this.raw.id,
            },
            text,
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
     * Note that some users (particularly, users with hidden forwards)
     * may not be mentioned like this outside the chats you have in common.
     *
     * This method is only needed when the result will be
     * stored somewhere outside current mtcute instance (e.g. saved for later use),
     * otherwise {@link mention} will be enough.
     *
     * > **Note**: This method doesn't format anything on its own.
     * > Instead, it returns a {@link MessageEntity} that can later
     * > be used with `html` or `md` template tags
     *
     * > **Note**: the resulting text can only be used by clients
     * > that support mtcute notation of permanent
     * > mention links (`tg://user?id=123&hash=abc`).
     * >
     * > Also note that these permanent mentions are only
     * > valid for current account, since peer access hashes are
     * > account-specific and can't be used on another account.
     * >
     * > Also note that for some users such mentions might not work at all
     * > due to privacy settings.
     *
     * @param text  Mention text
     */
    permanentMention(text?: string | null): MessageEntity {
        if (!this.raw.accessHash) {
            throw new MtArgumentError("User's access hash is not available!")
        }

        if (!text) text = this.displayName

        return new MessageEntity(
            {
                _: 'messageEntityTextUrl',
                offset: 0,
                length: text.length,
                url: `tg://user?id=${this.id}&hash=${this.raw.accessHash.toString(16)}`,
            },
            text,
        )
    }
}

memoizeGetters(User, [
    '_parsedStatus' as keyof User,
    'usernames',
    'inputPeer',
    'photo',
    'emojiStatus',
    'color',
    'profileColors',
])
makeInspectable(User, undefined, ['_parsedStatus' as keyof User])
