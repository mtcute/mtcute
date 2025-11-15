import type { tl } from '@mtcute/tl'

import { MtArgumentError, MtTypeAssertionError } from '../../../types/errors.js'
import { getMarkedPeerId } from '../../../utils/peer-utils.js'
import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { MessageEntity } from '../messages/message-entity.js'

import { EmojiStatus } from '../reactions/emoji-status.js'
import { ChatColors } from './chat-colors.js'
import { ChatPermissions } from './chat-permissions.js'
import { ChatPhoto } from './chat-photo.js'

/**
 * Chat type. Can be:
 *  - `group`: Legacy/basic group
 *  - `supergroup`: Supergroup
 *  - `channel`: Broadcast channel
 *  - `gigagroup`: Gigagroup aka Broadcast group
 *  - `monoforum`: Monoforum (chat for direct messages to channel administrators)
 */
export type ChatType = 'group' | 'supergroup' | 'channel' | 'gigagroup' | 'monoforum'

/**
 * A chat.
 */
export class Chat {
  readonly type = 'chat' as const

  /**
   * Raw peer object that this {@link Chat} represents.
   */
  readonly raw: tl.RawChat | tl.RawChannel | tl.RawChatForbidden | tl.RawChannelForbidden

  constructor(peer: tl.TypeChat) {
    switch (peer._) {
      case 'chat':
      case 'channel':
      case 'chatForbidden':
      case 'channelForbidden':
        break
      default:
        throw new MtTypeAssertionError('peer', 'user | chat | channel', peer._)
    }

    this.raw = peer
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
   * For a rough list of fields that may be missing, see the
   * official docs for [channel](https://core.telegram.org/constructor/channel)
   * and [user](https://core.telegram.org/constructor/user).
   *
   * This currently only ever happens for non-bot users, so if you are building
   * a normal bot, you can safely ignore this field.
   *
   * To fetch the "complete" chat information, use one of these methods:
   *  - {@link TelegramClient.getChat}
   *  - {@link TelegramClient.getFullChat}.
   *
   * Learn more: [Incomplete peers](https://mtcute.dev/guide/topics/peers.html#incomplete-peers)
   */
  get isMin(): boolean {
    // avoid additional runtime checks
    return Boolean((this.raw as { min?: boolean }).min)
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
    switch (this.raw._) {
      case 'chat':
      case 'chatForbidden':
        return {
          _: 'inputPeerChat',
          chatId: this.raw.id,
        }
      case 'channel':
      case 'channelForbidden':
        if ((this.raw as tl.RawChannel).min) {
          return {
            _: 'mtcute.dummyInputPeerMinChannel',
            channelId: this.raw.id,
          }
        }

        if (!this.raw.accessHash) {
          throw new MtArgumentError("Peer's access hash is not available!")
        }

        return {
          _: 'inputPeerChannel',
          channelId: this.raw.id,
          accessHash: this.raw.accessHash,
        }
    }
  }

  /** Type of chat */
  get chatType(): ChatType {
    switch (this.raw._) {
      case 'chat':
      case 'chatForbidden':
        return 'group'
      case 'channel':
      case 'channelForbidden':
        if (this.raw._ === 'channel' && this.raw.gigagroup) {
          return 'gigagroup'
        } else if (this.raw._ === 'channel' && this.raw.monoforum) {
          return 'monoforum'
        } else if (this.raw.broadcast) {
          return 'channel'
        } else if (this.raw.megagroup) {
          return 'supergroup'
        }

        throw new MtArgumentError('Unknown chat type')
    }
  }

  /**
   * Whether this chat is a group chat (i.e. not a channel)
   */
  get isGroup(): boolean {
    return this.chatType !== 'channel'
  }

  /**
   * Whether this chat has been verified by Telegram.
   * Supergroups, channels and groups only
   */
  get isVerified(): boolean {
    return 'verified' in this.raw ? this.raw.verified! : false
  }

  /**
   * Whether this chat has been restricted.
   * See {@link restrictions} for details
   */
  get isRestricted(): boolean {
    return 'restricted' in this.raw ? this.raw.restricted! : false
  }

  /**
   * Whether this chat is owned by the current user.
   * Supergroups, channels and groups only
   */
  get isCreator(): boolean {
    return 'creator' in this.raw ? this.raw.creator! : false
  }

  /**
   * Whether current user has admin rights in this chat.
   * Supergroups, channels and groups only.
   */
  get isAdmin(): boolean {
    return 'adminRights' in this.raw && Boolean(this.raw.adminRights)
  }

  /** Whether this chat has been flagged for scam */
  get isScam(): boolean {
    return 'scam' in this.raw ? this.raw.scam! : false
  }

  /** Whether this chat has been flagged for impersonation */
  get isFake(): boolean {
    return 'fake' in this.raw ? this.raw.fake! : false
  }

  /** Whether this peer is a forum supergroup */
  get isForum(): boolean {
    return this.raw._ === 'channel' && this.raw.forum!
  }

  /**
   * Whether the chat is not available (e.g. because the user was banned from there).
   *
   * **Note**: This method checks if the underlying peer is [`chatForbidden`](https://core.telegram.org/constructor/chatForbidden)
   * or [`channelForbidden`](https://core.telegram.org/constructor/channelForbidden).
   * In some cases this field might be `false` *even if* the user is not a member of the chat,
   * and calling `.getChat()` will throw `CHANNEL_PRIVATE`.
   * In particular, this seems to be the case for `.forward.sender` of {@link Message} objects.
   *
   * Consider also checking for {@link isLikelyUnavailable}.
   */
  get isBanned(): boolean {
    return this.raw._ === 'chatForbidden' || this.raw._ === 'channelForbidden'
  }

  /**
   * Whether the chat is likely not available (e.g. because the user was banned from there),
   * or the channel is private and the user is not a member of it.
   */
  get isLikelyUnavailable(): boolean {
    switch (this.raw._) {
      case 'chatForbidden':
      case 'channelForbidden':
        return true
      case 'chat':
        return this.raw.left! || this.raw.deactivated!
      case 'channel':
        // left = true, meaning we are not a member of it
        // no usernames => likely private
        // for megagroups it might be linked to a public channel
        return this.raw.left!
          && this.raw.username === undefined
          && this.raw.usernames === undefined
          && (
            this.raw.broadcast!
            || (this.raw.megagroup! && !this.raw.hasLink!)
          )
    }
  }

  /**
   * Whether the current user is a member of the chat.
   */
  get isMember(): boolean {
    switch (this.raw._) {
      case 'channel':
      case 'chat':
        return !this.raw.left
      default:
        return false
    }
  }

  /** Whether this chat has a call/livestrean active */
  get hasCall(): boolean {
    return 'callActive' in this.raw ? this.raw.callActive! : false
  }

  /** Whether this chat has a call/livestream, and there's at least one member in it */
  get hasCallMembers(): boolean {
    return 'callNotEmpty' in this.raw ? this.raw.callNotEmpty! : false
  }

  /** Whether you have hidden (arhived) this chat's stories */
  get storiesHidden(): boolean {
    return 'storiesHidden' in this.raw ? this.raw.storiesHidden! : false
  }

  get storiesUnavailable(): boolean {
    return 'storiesUnavailable' in this.raw ? this.raw.storiesUnavailable! : false
  }

  /** Whether this group is a channel/supergroup with join requests enabled */
  get hasJoinRequests(): boolean {
    return this.raw._ === 'channel' && this.raw.joinRequest!
  }

  /** Whether this group is a supergroup with join-to-send rule enabled */
  get hasJoinToSend(): boolean {
    return this.raw._ === 'channel' && this.raw.joinToSend!
  }

  /** Whether this group has content protection (i.e. disabled forwards) */
  get hasContentProtection(): boolean {
    return (this.raw._ === 'channel' || this.raw._ === 'chat') && this.raw.noforwards!
  }

  /** Whether this channel has profile signatures (i.e. "Super Channel") */
  get hasProfileSignatures(): boolean {
    return this.raw._ === 'channel' && this.raw.signatureProfiles!
  }

  /** Whether this channel has author signatures enabled under posts */
  get hasSignatures(): boolean {
    return this.raw._ === 'channel' && this.raw.signatures!
  }

  /** Whether this chat/channel has auto-translation enabled */
  get hasAutoTranslation(): boolean {
    return this.raw._ === 'channel' && this.raw.autotranslation!
  }

  /** Whether this forum should display threads as tabs instead of a list */
  get hasForumTabs(): boolean {
    return this.raw._ === 'channel' && this.raw.forumTabs!
  }

  /** Whether this broadcast channel has direct messages to channel administrators enabled */
  get hasBroadcastDirect(): boolean {
    return this.raw._ === 'channel' && this.raw.broadcastMessagesAllowed!
  }

  /**
   * Depending on {@link chatType}:
   *   - `channel`: this field might contain the ID of the linked monoforum,
   *     if this broadcast channel has a linked monoforum
   *   - `monoforum`: this field contains the ID of the channel that this monoforum is linked to
   */
  get monoforumLinkedChatId(): number | null {
    return this.raw._ === 'channel' ? this.raw.linkedMonoforumId ?? null : null
  }

  /** Chat title */
  get title(): string {
    return this.raw.title
  }

  /** Chat username (if available) */
  get username(): string | null {
    if (!('username' in this.raw)) return null

    return this.raw.username ?? this.raw.usernames?.[0].username ?? null
  }

  /**
   * Usernames (including collectibles), for private chats, bots, supergroups and channels if available
   */
  get usernames(): ReadonlyArray<tl.RawUsername> | null {
    if (!('usernames' in this.raw)) return null

    return (
      this.raw.usernames
      ?? (this.raw.username ? [{ _: 'username', username: this.raw.username, active: true }] : null)
    )
  }

  /**
   * Get the display name of the chat.
   *
   * Basically an alias to {@link title}, exists for consistency with {@link User}.
   */
  get displayName(): string {
    return this.raw.title
  }

  /**
   * Chat photo, if any.
   * Suitable for downloads only.
   *
   * If full chat information is available, prefer {@link FullChat#fullPhoto} instead.
   */
  get photo(): ChatPhoto | null {
    if (
      !('photo' in this.raw)
      || this.raw.photo?._ !== 'chatPhoto'
    ) {
      return null
    }

    return new ChatPhoto(this.inputPeer, this.raw.photo)
  }

  /**
   * The list of reasons why this chat might be unavailable to some users.
   * This field is available only in case {@link isRestricted} is `true`
   */
  get restrictions(): ReadonlyArray<tl.RawRestrictionReason> | null {
    return 'restrictionReason' in this.raw ? this.raw.restrictionReason ?? null : null
  }

  /**
   * Current user's permissions, for supergroups.
   */
  get permissions(): ChatPermissions | null {
    if (!('bannedRights' in this.raw && this.raw.bannedRights)) {
      return null
    }

    return new ChatPermissions(this.raw.bannedRights)
  }

  /**
   * Default chat member permissions, for groups and supergroups.
   */
  get defaultPermissions(): ChatPermissions | null {
    if (!('defaultBannedRights' in this.raw) || !this.raw.defaultBannedRights) {
      return null
    }

    return new ChatPermissions(this.raw.defaultBannedRights)
  }

  /**
   * Admin rights of the current user in this chat, if any.`
   */
  get adminRights(): tl.RawChatAdminRights | null {
    return 'adminRights' in this.raw ? this.raw.adminRights ?? null : null
  }

  /**
   * Distance in meters of this group chat from your location
   * Returned only in {@link TelegramClient.getNearbyChats}
   */
  readonly distance?: number

  /**
   * Maximum ID of stories this chat has (or 0 if none)
   */
  get storiesMaxId(): tl.RawRecentStory | null {
    return this.raw._ === 'channel' ? this.raw.storiesMaxId ?? null : null
  }

  /**
   * Color that should be used when rendering replies to
   * the messages and web previews sent by this chat,
   * as well as to render the chat title
   */
  get color(): ChatColors {
    return new ChatColors(
      this.raw.id,
      this.raw._ === 'channel' && this.raw.color?._ === 'peerColor' ? this.raw.color : undefined,
    )
  }

  /**
   * Chat's emoji status, if any.
   */
  get emojiStatus(): EmojiStatus | null {
    if (this.raw._ !== 'channel') return null

    return EmojiStatus.fromTl(this.raw.emojiStatus)
  }

  /**
   * If non-null, this user was verified by a bot, and this field contains
   * the ID of the custom emoji to display as the verification icon.
   */
  get customVerificationEmojiId(): tl.Long | null {
    if (this.raw._ !== 'channel') return null
    return this.raw.botVerificationIcon ?? null
  }

  /**
   * Color that should be used when rendering the header of
   * the user's profile
   */
  get profileColors(): ChatColors {
    return new ChatColors(
      this.raw.id,
      this.raw._ === 'channel' && this.raw.profileColor?._ === 'peerColor' ? this.raw.profileColor : undefined,
    )
  }

  /** Boosts level this chat has (0 if none or is not a channel) */
  get boostsLevel(): number {
    return this.raw._ === 'channel' ? this.raw.level ?? 0 : 0
  }

  /**
   * If a subscription to this channel was bought using Telegram Stars,
   * this field will contain the date when the subscription will expire.
   */
  get subscriptionUntilDate(): Date | null {
    if (this.raw._ !== 'channel' || !this.raw.subscriptionUntilDate) return null

    return new Date(this.raw.subscriptionUntilDate * 1000)
  }

  /** Date when the current user joined this chat (if available) */
  get joinDate(): Date | null {
    return this.isMember && ('date' in this.raw) ? new Date(this.raw.date * 1000) : null
  }

  /** Date when the chat was created (if available) */
  get creationDate(): Date | null {
    return !this.isMember && ('date' in this.raw) ? new Date(this.raw.date * 1000) : null
  }

  /**
   * Date when the current user will be unbanned (if available)
   *
   * Returns `null` if the user is not banned, or if the ban is permanent
   */
  get bannedUntilDate(): Date | null {
    if (this.raw._ !== 'channelForbidden' || !this.raw.untilDate) return null

    return new Date(this.raw.untilDate * 1000)
  }

  /**
   * Number of members in this chat (if available)
   *
   * If not available, try fetching a full chat info with {@link TelegramClient.getFullChat}
   */
  get membersCount(): number | null {
    return 'participantsCount' in this.raw ? this.raw.participantsCount ?? null : null
  }

  /**
   * If this chat is a basic group that has been migrated to a supergroup,
   * this field will contain the input peer of that supergroup.
   */
  get migratedTo(): tl.TypeInputChannel | null {
    return this.raw._ === 'chat' ? this.raw.migratedTo ?? null : null
  }

  /**
   * If this chat is a basic group that has been migrated to a supergroup,
   * this field will contain the marked ID of that supergroup.
   */
  get migratedToId(): number | null {
    if (this.raw._ !== 'chat') return null
    if (!this.raw.migratedTo) return null

    return getMarkedPeerId(this.raw.migratedTo)
  }

  /** If this chat has paid messages enabled, price of one message in stars */
  get paidMessagePrice(): tl.Long | null {
    return this.raw._ === 'channel' ? this.raw.sendPaidMessagesStars ?? null : null
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
  'permissions',
  'defaultPermissions',
  'color',
])
makeInspectable(Chat, [])
