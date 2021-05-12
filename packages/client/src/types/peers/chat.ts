import { ChatPhoto } from './chat-photo'
import { tl } from '@mtcute/tl'
import { ChatPermissions } from './chat-permissions'
import { TelegramClient } from '../../client'
import { getMarkedPeerId, MaybeArray } from '@mtcute/core'
import { MtCuteArgumentError, MtCuteTypeAssertionError } from '../errors'
import { makeInspectable } from '../utils'
import { ChatsIndex, InputPeerLike, User, UsersIndex } from './index'
import { ChatLocation } from './chat-location'

export namespace Chat {
    /**
     * Chat type. Can be:
     *  - `private`: PM with other users or yourself (Saved Messages)
     *  - `bot`: PM with a bot
     *  - `group`: Legacy group
     *  - `supergroup`: Supergroup
     *  - `channel`: Broadcast channel
     *  - `gigagroup`: Gigagroup aka Broadcast group
     */
    export type Type =
        | 'private'
        | 'bot'
        | 'group'
        | 'supergroup'
        | 'channel'
        | 'gigagroup'
}

/**
 * A chat.
 */
export class Chat {
    /** Telegram client used for this chat */
    readonly client: TelegramClient

    /**
     * Raw peer object that this {@link Chat} represents.
     */
    readonly peer:
        | tl.RawUser
        | tl.RawChat
        | tl.RawChannel
        | tl.RawChatForbidden
        | tl.RawChannelForbidden

    /**
     * Raw full peer object that this {@link Chat} represents.
     */
    readonly fullPeer?: tl.TypeUserFull | tl.TypeChatFull

    constructor(
        client: TelegramClient,
        peer: tl.TypeUser | tl.TypeChat,
        fullPeer?: tl.TypeUserFull | tl.TypeChatFull
    ) {
        if (!peer) throw new MtCuteArgumentError('peer is not available')

        if (
            !(
                peer._ === 'user' ||
                peer._ === 'chat' ||
                peer._ === 'channel' ||
                peer._ === 'chatForbidden' ||
                peer._ === 'channelForbidden'
            )
        )
            throw new MtCuteTypeAssertionError(
                'peer',
                'user | chat | channel',
                peer._
            )

        this.client = client
        this.peer = peer
        this.fullPeer = fullPeer
    }

    /** Marked ID of this chat */
    get id(): number {
        return getMarkedPeerId(this.inputPeer)
    }

    private _inputPeer?: tl.TypeInputPeer
    /**
     * Chat's input peer
     */
    get inputPeer(): tl.TypeInputPeer {
        if (!this._inputPeer) {
            if (this.peer._ === 'user') {
                if (!this.peer.accessHash) {
                    throw new MtCuteArgumentError(
                        "Peer's access hash is not available!"
                    )
                }

                this._inputPeer = {
                    _: 'inputPeerUser',
                    userId: this.peer.id,
                    accessHash: this.peer.accessHash,
                }
            } else if (
                this.peer._ === 'chat' ||
                this.peer._ === 'chatForbidden'
            ) {
                this._inputPeer = {
                    _: 'inputPeerChat',
                    chatId: this.peer.id,
                }
            } else if (
                this.peer._ === 'channel' ||
                this.peer._ === 'channelForbidden'
            ) {
                if (!this.peer.accessHash) {
                    throw new MtCuteArgumentError(
                        "Peer's access hash is not available!"
                    )
                }

                this._inputPeer = {
                    _: 'inputPeerChannel',
                    channelId: this.peer.id,
                    accessHash: this.peer.accessHash,
                }
            }
        }

        return this._inputPeer!
    }

    private _type?: Chat.Type
    /** Type of chat */
    get type(): Chat.Type {
        if (!this._type) {
            if (this.peer._ === 'user') {
                this._type = this.peer.bot ? 'bot' : 'private'
            } else if (
                this.peer._ === 'chat' ||
                this.peer._ === 'chatForbidden'
            ) {
                this._type = 'group'
            } else if (
                this.peer._ === 'channel' ||
                this.peer._ === 'channelForbidden'
            ) {
                this._type =
                    this.peer._ === 'channel' && this.peer.gigagroup
                        ? 'gigagroup'
                        : this.peer.broadcast
                        ? 'channel'
                        : 'supergroup'
            }
        }

        return this._type!
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
        return 'adminRights' in this.peer && !!this.peer.adminRights
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
        return 'username' in this.peer ? this.peer.username ?? null : null
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
            if (this.peer.lastName)
                return this.peer.firstName + ' ' + this.peer.lastName
            return this.peer.firstName ?? 'Deleted Account'
        } else {
            return this.peer.title
        }
    }

    private _photo?: ChatPhoto
    /**
     * Chat photo, if any.
     * Suitable for downloads only.
     */
    get photo(): ChatPhoto | null {
        if (
            !('photo' in this.peer) ||
            !this.peer.photo ||
            (this.peer.photo._ !== 'userProfilePhoto' &&
                this.peer.photo._ !== 'chatPhoto')
        )
            return null

        if (!this._photo) {
            this._photo = new ChatPhoto(
                this.client,
                this.inputPeer,
                this.peer.photo
            )
        }

        return this._photo
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
        return ('photo' in this.peer && (this.peer.photo as any))?.dcId ?? null
    }

    /**
     * Chat's permanent invite link, for groups, supergroups and channels.
     * Returned only in {@link TelegramClient.getFullChat}
     */
    get inviteLink(): string | null {
        return this.fullPeer && this.fullPeer._ !== 'userFull'
            ? this.fullPeer.exportedInvite?.link ?? null
            : null
    }

    /**
     * For supergroups, name of the group sticker set.
     * Returned only in {@link TelegramClient.getFullChat}
     */
    get stickerSetName(): string | null {
        return this.fullPeer && this.fullPeer._ === 'channelFull'
            ? this.fullPeer.stickerset?.shortName ?? null
            : null
    }

    /**
     * Whether the group sticker set can be changed by you.
     * Returned only in {@link TelegramClient.getFullChat}
     */
    get canSetStickerSet(): boolean | null {
        return this.fullPeer && this.fullPeer._ === 'channelFull'
            ? this.fullPeer.canSetStickers ?? null
            : null
    }

    /**
     * Chat members count, for groups, supergroups and channels only.
     * Returned only in {@link TelegramClient.getFullChat}
     */
    get membersCount(): number | null {
        return this.fullPeer && this.fullPeer._ !== 'userFull'
            ? this.fullPeer._ === 'chatFull'
                ? this.fullPeer.participants._ === 'chatParticipants'
                    ? this.fullPeer.participants.participants.length
                    : null
                : this.fullPeer._ === 'channelFull'
                ? this.fullPeer.participantsCount ?? null
                : null
            : null
    }

    /**
     * The list of reasons why this chat might be unavailable to some users.
     * This field is available only in case {@link isRestricted} is `true`
     */
    get restrictions(): ReadonlyArray<tl.RawRestrictionReason> | null {
        return 'restrictionReason' in this.peer
            ? this.peer.restrictionReason ?? null
            : null
    }

    private _permissions?: ChatPermissions

    /**
     * Current user's permissions, for supergroups.
     */
    get permissions(): ChatPermissions | null {
        if (!('bannedRights' in this.peer && this.peer.bannedRights))
            return null

        if (!this._permissions) {
            this._permissions = new ChatPermissions(this.peer.bannedRights)
        }

        return this._permissions
    }

    /**
     * Default chat member permissions, for groups and supergroups.
     */
    get defaultPermissions(): ChatPermissions | null {
        if (
            !('defaultBannedRights' in this.peer) ||
            !this.peer.defaultBannedRights
        )
            return null

        if (!this._permissions) {
            this._permissions = new ChatPermissions(
                this.peer.defaultBannedRights
            )
        }

        return this._permissions
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

    private _location?: ChatLocation
    /**
     * Location of the chat.
     * Returned only in {@link TelegramClient.getFullChat}
     */
    get location(): ChatLocation | null {
        if (!this.fullPeer || this.fullPeer._ !== 'channelFull' || this.fullPeer.location?._ !== 'channelLocation')
            return null

        if (!this._location) {
            this._location = new ChatLocation(this.client, this.fullPeer.location)
        }

        return this._location
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

    private _user?: User
    /**
     * Get a {@link User} from this chat.
     *
     * Returns `null` if this is not a chat with user
     */
    get user(): User | null {
        if (this.peer._ !== 'user') return null

        if (!this._user) this._user = new User(this.client, this.peer)
        return this._user
    }

    /** @internal */
    static _parseFromMessage(
        client: TelegramClient,
        message: tl.RawMessage | tl.RawMessageService,
        users: UsersIndex,
        chats: ChatsIndex
    ): Chat {
        return Chat._parseFromPeer(client, message.peerId, users, chats)
    }

    /** @internal */
    static _parseFromPeer(
        client: TelegramClient,
        peer: tl.TypePeer,
        users: UsersIndex,
        chats: ChatsIndex
    ): Chat {
        if (peer._ === 'peerUser') {
            return new Chat(client, users[peer.userId])
        }

        if (peer._ === 'peerChat') {
            return new Chat(client, chats[peer.chatId])
        }

        return new Chat(client, chats[peer.channelId])
    }

    /** @internal */
    static _parseFull(
        client: TelegramClient,
        full: tl.messages.RawChatFull | tl.RawUserFull
    ): Chat {
        if (full._ === 'userFull') {
            return new Chat(client, full.user, full)
        } else {
            const fullChat = full.fullChat
            let chat: tl.TypeChat | undefined = undefined
            let linked: tl.TypeChat | undefined = undefined

            for (const c of full.chats) {
                if (fullChat.id === c.id) {
                    chat = c
                }
                if (
                    fullChat._ === 'channelFull' &&
                    fullChat.linkedChatId === c.id
                ) {
                    linked = c
                }
            }

            const ret = new Chat(client, chat!, fullChat)
            ret._linkedChat = linked ? new Chat(client, linked) : undefined
            return ret
        }
    }

    // todo: bound methods https://github.com/pyrogram/pyrogram/blob/a86656aefcc93cc3d2f5c98227d5da28fcddb136/pyrogram/types/user_and_chats/chat.py#L319

    /**
     * Join this chat.
     */
    async join(): Promise<void> {
        await this.client.joinChat(this.inputPeer)
    }

    /**
     * Add user(s) to this chat
     *
     * @param users  ID(s) of the users, their username(s) or phone(s).
     * @param forwardCount
     *   Number of old messages to be forwarded (0-100).
     *   Only applicable to legacy groups, ignored for supergroups and channels
     */
    async addMembers(
        users: MaybeArray<InputPeerLike>,
        forwardCount?: number
    ): Promise<void> {
        return this.client.addChatMembers(this.inputPeer, users, forwardCount)
    }

    /**
     * Archive this chat
     */
    async archive(): Promise<void> {
        return this.client.archiveChats(this.inputPeer)
    }

    /**
     * Unarchive this chat
     */
    async unarchive(): Promise<void> {
        return this.client.unarchiveChats(this.inputPeer)
    }
}

makeInspectable(Chat, [], ['user'])
