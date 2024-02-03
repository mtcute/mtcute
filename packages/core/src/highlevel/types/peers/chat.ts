import { tl } from '@mtcute/tl'

import { MtArgumentError, MtTypeAssertionError } from '../../../types/errors.js'
import { getMarkedPeerId } from '../../../utils/peer-utils.js'
import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { Photo } from '../media/photo.js'
import { MessageEntity } from '../messages/message-entity.js'
import { ChatColors } from './chat-colors.js'
import { ChatLocation } from './chat-location.js'
import { ChatPermissions } from './chat-permissions.js'
import { ChatPhoto } from './chat-photo.js'
import { PeersIndex } from './peers-index.js'
import { User } from './user.js'

/**
 * Chat type. Can be:
 *  - `private`: PM with other users or yourself (Saved Messages)
 *  - `bot`: PM with a bot
 *  - `group`: Legacy group
 *  - `supergroup`: Supergroup
 *  - `channel`: Broadcast channel
 *  - `gigagroup`: Gigagroup aka Broadcast group
 */
export type ChatType = 'private' | 'bot' | 'group' | 'supergroup' | 'channel' | 'gigagroup'

/**
 * A chat.
 */
export class Chat {
    readonly type = 'chat' as const

    /**
     * Raw peer object that this {@link Chat} represents.
     */
    readonly peer: tl.RawUser | tl.RawChat | tl.RawChannel | tl.RawChatForbidden | tl.RawChannelForbidden

    constructor(
        peer: tl.TypeUser | tl.TypeChat,
        readonly fullPeer?: tl.TypeUserFull | tl.TypeChatFull,
    ) {
        if (!peer) throw new MtArgumentError('peer is not available')

        switch (peer._) {
            case 'user':
            case 'chat':
            case 'channel':
            case 'chatForbidden':
            case 'channelForbidden':
                break
            default:
                throw new MtTypeAssertionError('peer', 'user | chat | channel', peer._)
        }

        this.peer = peer
    }

    /** Marked ID of this chat */
    get id(): number {
        return getMarkedPeerId(this.inputPeer)
    }

    /**
     * Whether this chat's information is incomplete.
     *
     * This usually only happens in large chats, where
     * the server sometimes sends only a part of the chat's
     * information. Basic info like name and profile photo
     * are always available, but other fields may be omitted
     * despite being available.
     *
     * It was observed that these fields may be missing:
     *   - `isMember`
     *   - and probably more
     *
     * This currently only ever happens for non-bot users, so if you are building
     * a normal bot, you can safely ignore this field.
     *
     * To fetch the "complete" user information, use one of these methods:
     *  - {@link TelegramClient.getChat}
     *  - {@link TelegramClient.getFullChat}.
     *
     * Learn more: [Incomplete peers](https://mtcute.dev/guide/topics/peers.html#incomplete-peers)
     */
    get isMin(): boolean {
        // avoid additional runtime checks
        return Boolean((this.peer as { min?: boolean }).min)
    }

    /**
     * Chat's input peer for advanced use-cases.
     *
     * > **Note**: for {@link min} chats, this method will return
     * > `mtcute.dummyInputPeerMin*`, which are actually not a valid input peer,
     * > These are used to indicate that the user is incomplete, and a message
     * > reference is needed to resolve the peer.
     * >
     * > Such objects are handled by {@link TelegramClient.resolvePeer} method,
     * so prefer using it whenever you need an input peer.
     */
    get inputPeer(): tl.TypeInputPeer {
        switch (this.peer._) {
            case 'user':
                if (this.peer.min) {
                    return {
                        _: 'mtcute.dummyInputPeerMinUser',
                        userId: this.peer.id,
                    }
                }

                if (!this.peer.accessHash) {
                    throw new MtArgumentError("Peer's access hash is not available!")
                }

                return {
                    _: 'inputPeerUser',
                    userId: this.peer.id,
                    accessHash: this.peer.accessHash,
                }
            case 'chat':
            case 'chatForbidden':
                return {
                    _: 'inputPeerChat',
                    chatId: this.peer.id,
                }
            case 'channel':
            case 'channelForbidden':
                if ((this.peer as tl.RawChannel).min) {
                    return {
                        _: 'mtcute.dummyInputPeerMinChannel',
                        channelId: this.peer.id,
                    }
                }

                if (!this.peer.accessHash) {
                    throw new MtArgumentError("Peer's access hash is not available!")
                }

                return {
                    _: 'inputPeerChannel',
                    channelId: this.peer.id,
                    accessHash: this.peer.accessHash,
                }
        }
    }

    /** Type of chat */
    get chatType(): ChatType {
        switch (this.peer._) {
            case 'user':
                return this.peer.bot ? 'bot' : 'private'
            case 'chat':
            case 'chatForbidden':
                return 'group'
            case 'channel':
            case 'channelForbidden':
                if (this.peer._ === 'channel' && this.peer.gigagroup) {
                    return 'gigagroup'
                } else if (this.peer.broadcast) {
                    return 'channel'
                }

                return 'supergroup'
        }
    }

    /**
     * Whether this chat is a group chat
     * (i.e. not a channel and not PM)
     */
    get isGroup(): boolean {
        switch (this.chatType) {
            case 'group':
            case 'supergroup':
            case 'gigagroup':
                return true
        }

        return false
    }

    /**
     * Whether this chat has been verified by Telegram.
     * Supergroups, channels and groups only
     */
    get isVerified(): boolean {
        return 'verified' in this.peer ? this.peer.verified! : false
    }

    /**
     * Whether this chat has been restricted.
     * See {@link restrictions} for details
     */
    get isRestricted(): boolean {
        return 'restricted' in this.peer ? this.peer.restricted! : false
    }

    /**
     * Whether this chat is owned by the current user.
     * Supergroups, channels and groups only
     */
    get isCreator(): boolean {
        return 'creator' in this.peer ? this.peer.creator! : false
    }

    /**
     * Whether current user has admin rights in this chat.
     * Supergroups, channels and groups only.
     */
    get isAdmin(): boolean {
        return 'adminRights' in this.peer && Boolean(this.peer.adminRights)
    }

    /** Whether this chat has been flagged for scam */
    get isScam(): boolean {
        return 'scam' in this.peer ? this.peer.scam! : false
    }

    /** Whether this chat has been flagged for impersonation */
    get isFake(): boolean {
        return 'fake' in this.peer ? this.peer.fake! : false
    }

    /** Whether this chat is part of the Telegram support team. Users and bots only */
    get isSupport(): boolean {
        return this.peer._ === 'user' && this.peer.support!
    }

    /** Whether this chat is chat with yourself (i.e. Saved Messages) */
    get isSelf(): boolean {
        return this.peer._ === 'user' && this.peer.self!
    }

    /** Whether this peer is your contact */
    get isContact(): boolean {
        return this.peer._ === 'user' && this.peer.contact!
    }

    /** Whether this peer is a forum supergroup */
    get isForum(): boolean {
        return this.peer._ === 'channel' && this.peer.forum!
    }

    /**
     * Whether the current user is a member of the chat.
     *
     * For users, this is always `true`.
     */
    get isMember(): boolean {
        switch (this.peer._) {
            case 'user':
                return true
            case 'channel':
            case 'chat':
                return !this.peer.left
            default:
                return false
        }
    }

    /** Whether you have hidden (arhived) this chat's stories */
    get storiesHidden(): boolean {
        return 'storiesHidden' in this.peer ? this.peer.storiesHidden! : false
    }

    get storiesUnavailable(): boolean {
        return 'storiesUnavailable' in this.peer ? this.peer.storiesUnavailable! : false
    }

    /** Whether this group is a channel/supergroup with join requests enabled */
    get hasJoinRequests(): boolean {
        return this.peer._ === 'channel' && this.peer.joinRequest!
    }

    /** Whether this group is a supergroup with join-to-send rule enabled */
    get hasJoinToSend(): boolean {
        return this.peer._ === 'channel' && this.peer.joinToSend!
    }

    /** Whether this group has content protection (i.e. disabled forwards) */
    get hasContentProtection(): boolean {
        return (this.peer._ === 'channel' || this.peer._ === 'chat') && this.peer.noforwards!
    }

    /**
     * Whether this chat (user) has restricted sending them voice/video messages.
     *
     * Returned only in {@link TelegramClient.getFullChat}
     */
    get hasBlockedVoices(): boolean {
        return this.fullPeer?._ === 'userFull' && this.fullPeer.voiceMessagesForbidden!
    }

    /**
     * Title, for supergroups, channels and groups
     */
    get title(): string | null {
        return this.peer._ !== 'user' ? this.peer.title ?? null : null
    }

    /**
     * Username, for private chats, bots, supergroups and channels if available
     */
    get username(): string | null {
        if (!('username' in this.peer)) return null

        return this.peer.username ?? this.peer.usernames?.[0].username ?? null
    }

    /**
     * Usernames (inclufing collectibles), for private chats, bots, supergroups and channels if available
     */
    get usernames(): ReadonlyArray<tl.RawUsername> | null {
        if (!('usernames' in this.peer)) return null

        return (
            this.peer.usernames ??
            (this.peer.username ? [{ _: 'username', username: this.peer.username, active: true }] : null)
        )
    }

    /**
     * First name of the other party in a private chat,
     * for private chats and bots
     */
    get firstName(): string | null {
        return this.peer._ === 'user' ? this.peer.firstName ?? null : null
    }

    /**
     * Last name of the other party in a private chat, for private chats
     */
    get lastName(): string | null {
        return this.peer._ === 'user' ? this.peer.lastName ?? null : null
    }

    /**
     * Get the display name of the chat.
     *
     * Title for groups and channels,
     * name (and last name if available) for users
     */
    get displayName(): string {
        if (this.peer._ === 'user') {
            if (this.peer.lastName) {
                return this.peer.firstName + ' ' + this.peer.lastName
            }

            return this.peer.firstName ?? 'Deleted Account'
        }

        return this.peer.title
    }

    /**
     * Chat photo, if any.
     * Suitable for downloads only.
     *
     * If full chat information is available, prefer {@link fullPhoto} instead.
     */
    get photo(): ChatPhoto | null {
        if (
            !('photo' in this.peer) ||
            !this.peer.photo ||
            (this.peer.photo._ !== 'userProfilePhoto' && this.peer.photo._ !== 'chatPhoto')
        ) {
            return null
        }

        return new ChatPhoto(this.inputPeer, this.peer.photo)
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
     *
     * Only available in {@link TelegramClient.getFullChat}
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
     * Returned only in {@link TelegramClient.getFullChat}
     */
    get personalPhoto(): Photo | null {
        if (!this.fullPeer || this.fullPeer._ !== 'userFull') return null
        if (this.fullPeer.personalPhoto?._ !== 'photo') return null

        return new Photo(this.fullPeer.personalPhoto)
    }

    /**
     * Actual profile photo of the user, bypassing the custom one.
     *
     * Returned only in {@link TelegramClient.getFullChat}
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
     * Returned only in {@link TelegramClient.getFullChat}
     */
    get publicPhoto(): Photo | null {
        if (!this.fullPeer || this.fullPeer._ !== 'userFull') return null
        if (this.fullPeer.fallbackPhoto?._ !== 'photo') return null

        return new Photo(this.fullPeer.fallbackPhoto)
    }

    /**
     * Bio of the other party in a private chat, or description of a
     * group, supergroup or channel.
     *
     * Returned only in {@link TelegramClient.getFullChat}
     */
    get bio(): string | null {
        return this.fullPeer?.about ?? null
    }

    /**
     * User's or bot's assigned DC (data center).
     * Available only in case the user has set a public profile photo.
     *
     * **Note**: this information is approximate; it is based on where
     * Telegram stores the current chat photo. It is accurate only in case
     * the owner has set the chat photo, otherwise it will be the DC assigned
     * to the administrator who set the current profile photo.
     */
    get dcId(): number | null {
        if (!('photo' in this.peer)) return null

        return (
            (this.peer.photo as Exclude<typeof this.peer.photo, tl.RawChatPhotoEmpty | tl.RawUserProfilePhotoEmpty>)
                ?.dcId ?? null
        )
    }

    /**
     * Chat's permanent invite link, for groups, supergroups and channels.
     * Returned only in {@link TelegramClient.getFullChat}
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
     * Returned only in {@link TelegramClient.getFullChat}
     */
    get stickerSetName(): string | null {
        return this.fullPeer && this.fullPeer._ === 'channelFull' ? this.fullPeer.stickerset?.shortName ?? null : null
    }

    /**
     * Whether the group sticker set can be changed by you.
     * Returned only in {@link TelegramClient.getFullChat}
     */
    get canSetStickerSet(): boolean | null {
        return this.fullPeer && this.fullPeer._ === 'channelFull' ? this.fullPeer.canSetStickers ?? null : null
    }

    /**
     * Chat members count, for groups, supergroups and channels only.
     * Returned only in {@link TelegramClient.getFullChat}
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
     * The list of reasons why this chat might be unavailable to some users.
     * This field is available only in case {@link isRestricted} is `true`
     */
    get restrictions(): ReadonlyArray<tl.RawRestrictionReason> | null {
        return 'restrictionReason' in this.peer ? this.peer.restrictionReason ?? null : null
    }

    /**
     * Current user's permissions, for supergroups.
     */
    get permissions(): ChatPermissions | null {
        if (!('bannedRights' in this.peer && this.peer.bannedRights)) {
            return null
        }

        return new ChatPermissions(this.peer.bannedRights)
    }

    /**
     * Default chat member permissions, for groups and supergroups.
     */
    get defaultPermissions(): ChatPermissions | null {
        if (!('defaultBannedRights' in this.peer) || !this.peer.defaultBannedRights) {
            return null
        }

        return new ChatPermissions(this.peer.defaultBannedRights)
    }

    /**
     * Admin rights of the current user in this chat.
     * `null` for PMs and non-administered chats
     */
    get adminRights(): tl.RawChatAdminRights | null {
        return 'adminRights' in this.peer ? this.peer.adminRights ?? null : null
    }

    /**
     * Distance in meters of this group chat from your location
     * Returned only in {@link TelegramClient.getNearbyChats}
     */
    readonly distance?: number

    /**
     * Location of the chat.
     * Returned only in {@link TelegramClient.getFullChat}
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
     *
     * Returned only in {@link TelegramClient.getFullChat}
     */
    get linkedChat(): Chat | null {
        return this._linkedChat ?? null
    }

    /**
     * TTL of all messages in this chat, in seconds
     *
     * Returned only in {@link TelegramClient.getFullChat}
     */
    get ttlPeriod(): number | null {
        return this.fullPeer?.ttlPeriod ?? null
    }

    /**
     * Maximum ID of stories this chat has (or 0 if none)
     */
    get storiesMaxId(): number {
        switch (this.peer._) {
            case 'channel':
            case 'user':
                return this.peer.storiesMaxId ?? 0
        }

        return 0
    }

    /**
     * Color that should be used when rendering replies to
     * the messages and web previews sent by this chat,
     * as well as to render the chat title
     */
    get color(): ChatColors {
        const color = this.peer._ === 'user' || this.peer._ === 'channel' ? this.peer.color : undefined

        return new ChatColors(this.peer.id, color)
    }

    /**
     * Get a {@link User} from this chat.
     *
     * Returns `null` if this is not a chat with user
     */
    get user(): User | null {
        if (this.peer._ !== 'user') return null

        return new User(this.peer)
    }

    /** @internal */
    static _parseFromMessage(message: tl.RawMessage | tl.RawMessageService, peers: PeersIndex): Chat {
        return Chat._parseFromPeer(message.peerId, peers)
    }

    /** @internal */
    static _parseFromPeer(peer: tl.TypePeer, peers: PeersIndex): Chat {
        switch (peer._) {
            case 'peerUser':
                return new Chat(peers.user(peer.userId))
            case 'peerChat':
                return new Chat(peers.chat(peer.chatId))
        }

        return new Chat(peers.chat(peer.channelId))
    }

    /** @internal */
    static _parseFull(full: tl.messages.RawChatFull | tl.users.TypeUserFull): Chat {
        if (full._ === 'users.userFull') {
            const user = full.users.find((it) => it.id === full.fullUser.id)

            if (!user || user._ === 'userEmpty') {
                throw new MtTypeAssertionError('Chat._parseFull', 'user', user?._ ?? 'undefined')
            }

            return new Chat(user, full.fullUser)
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

        const ret = new Chat(chat!, fullChat)
        ret._linkedChat = linked ? new Chat(linked) : undefined

        return ret
    }

    /**
     * Create a mention for the chat.
     *
     * If this is a user, works just like {@link User.mention}.
     * Otherwise, if the chat has a username, a `@username` is created
     * (or text link, if `text` is passed). If it does not, chat title is
     * simply returned without additional formatting.
     *
     * When available and `text` is omitted, this method will return `@username`.
     * Otherwise, text mention is created for the given (or default) parse mode
     *
     * Use `null` as `text` (first parameter) to force create a text
     * mention with display name, even if there is a username.
     *
     * > **Note**: This method doesn't format anything on its own.
     * > Instead, it returns a {@link MessageEntity} that can later
     * > be used with `html` or `md` template tags, or `unparse` method directly.
     *
     * @param text  Text of the mention.
     * @example
     * ```typescript
     * msg.replyText(html`Hello, ${msg.chat.mention()`)
     * ```
     */
    mention(text?: string | null): string | MessageEntity {
        if (this.user) return this.user.mention(text)

        if (text === undefined && this.username) {
            return `@${this.username}`
        }

        if (!text) text = this.displayName
        if (!this.username) return text

        return new MessageEntity(
            {
                _: 'messageEntityTextUrl',
                offset: 0,
                length: text.length,
                url: `https://t.me/${this.username}`,
            },
            text,
        )
    }
}

memoizeGetters(Chat, [
    'inputPeer',
    'chatType',
    'usernames',
    'photo',
    'fullPhoto',
    'personalPhoto',
    'realPhoto',
    'publicPhoto',
    'permissions',
    'defaultPermissions',
    'location',
    'user',
    'color',
])
makeInspectable(Chat, [], ['user'])
