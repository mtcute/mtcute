import { ChatPhoto } from './chat-photo'
import { tl } from '@mtcute/tl'
import { ChatPermissions } from './chat-permissions'
import { TelegramClient } from '../../client'
import { getMarkedPeerId } from '@mtcute/core'
import { MtCuteArgumentError, MtCuteTypeAssertionError } from '../errors'
import { makeInspectable } from '../utils'

export namespace Chat {
    /**
     * Chat type. Can be:
     *  - `private`: PM with other users or yourself (Saved Messages)
     *  - `bot`: PM with a bot
     *  - `group`: Legacy group
     *  - `supergroup`: Supergroup
     *  - `channel`: Broadcast channel
     *  - `broadcast`: Broadcast group
     */
    export type Type =
        | 'private'
        | 'bot'
        | 'group'
        | 'supergroup'
        | 'channel'
        | 'broadcast'
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
    readonly peer: tl.RawUser | tl.RawChat | tl.RawChannel

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

        if (!(peer._ === 'user' || peer._ === 'chat' || peer._ === 'channel'))
            throw new MtCuteTypeAssertionError(
                'Chat#constructor (@ peer)',
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
            } else if (this.peer._ === 'chat') {
                this._inputPeer = {
                    _: 'inputPeerChat',
                    chatId: this.peer.id,
                }
            } else if (this.peer._ === 'channel') {
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
            } else if (this.peer._ === 'chat') {
                this._type = 'group'
            } else if (this.peer._ === 'channel') {
                this._type = this.peer.megagroup
                    ? 'broadcast'
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
        return this.peer._ !== 'chat' && this.peer.verified!
    }

    /**
     * Whether this chat has been restricted.
     * See {@link restrictions} for details
     */
    get isRestricted(): boolean {
        return this.peer._ !== 'chat' && this.peer.restricted!
    }

    /**
     * Whether this chat is owned by the current user.
     * Supergroups, channels and groups only
     */
    get isCreator(): boolean {
        return this.peer._ !== 'user' && this.peer.creator!
    }

    /** Whether this chat has been flagged for scam */
    get isScam(): boolean {
        return this.peer._ !== 'chat' && this.peer.scam!
    }

    /** Whether this chat has been flagged for impersonation */
    get isFake(): boolean {
        return this.peer._ !== 'chat' && this.peer.fake!
    }

    /** Whether this chat is part of the Telegram support team. Users and bots only */
    get isSupport(): boolean {
        return this.peer._ === 'user' && this.peer.support!
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
        return this.peer._ !== 'chat' ? this.peer.username ?? null : null
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
            return this.peer.firstName!
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
     * Returned only in {@link TelegramClient.getChat}
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
        return (this.peer.photo as any)?.dcId ?? null
    }

    /**
     * Chat's permanent invite link, for groups, supergroups and channels.
     * Returned only in {@link TelegramClient.getChat}
     */
    get inviteLink(): string | null {
        return this.fullPeer && this.fullPeer._ !== 'userFull'
            ? this.fullPeer.exportedInvite?.link ?? null
            : null
    }

    /**
     * For supergroups, name of the group sticker set.
     * Returned only in {@link TelegramClient.getChat}
     */
    get stickerSetName(): string | null {
        return this.fullPeer && this.fullPeer._ === 'channelFull'
            ? this.fullPeer.stickerset?.shortName ?? null
            : null
    }

    /**
     * Whether the group sticker set can be changed by you.
     * Returned only in {@link TelegramClient.getChat}
     */
    get canSetStickerSet(): boolean | null {
        return this.fullPeer && this.fullPeer._ === 'channelFull'
            ? this.fullPeer.canSetStickers ?? null
            : null
    }

    /**
     * Chat members count, for groups, supergroups and channels only.
     * Returned only in {@link TelegramClient.getChat}
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
    get restrictions(): tl.RawRestrictionReason[] | null {
        return this.peer._ !== 'chat'
            ? this.peer.restrictionReason ?? null
            : null
    }

    private _permissions?: ChatPermissions

    /**
     * Current user's permissions, for supergroups.
     */
    get permissions(): ChatPermissions | null {
        if (this.peer._ !== 'channel' || !this.peer.bannedRights) return null

        if (!this._permissions) {
            this._permissions = new ChatPermissions(this.peer.bannedRights)
        }

        return this._permissions
    }

    /**
     * Default chat member permissions, for groups and supergroups.
     */
    get defaultPermissions(): ChatPermissions | null {
        if (this.peer._ === 'user' || !this.peer.defaultBannedRights)
            return null

        if (!this._permissions) {
            this._permissions = new ChatPermissions(
                this.peer.defaultBannedRights
            )
        }

        return this._permissions
    }

    /**
     * Distance in meters of this group chat from your location
     * Returned only in {@link TelegramClient.getNearbyChats}
     */
    readonly distance?: number

    private _linkedChat?: Chat
    /**
     * The linked discussion group (in case of channels)
     * or the linked channel (in case of supergroups).
     *
     * Returned only in {@link TelegramClient.getChat}
     */
    get linkedChat(): Chat | null {
        return this._linkedChat ?? null
    }

    /** @internal */
    static _parseFromMessage(
        client: TelegramClient,
        message: tl.RawMessage | tl.RawMessageService,
        users: Record<number, tl.TypeUser>,
        chats: Record<number, tl.TypeChat>
    ): Chat {
        return Chat._parseFromPeer(client, message.peerId, users, chats)
    }

    /** @internal */
    static _parseFromPeer(
        client: TelegramClient,
        peer: tl.TypePeer,
        users: Record<number, tl.TypeUser>,
        chats: Record<number, tl.TypeChat>
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
}

makeInspectable(Chat)
