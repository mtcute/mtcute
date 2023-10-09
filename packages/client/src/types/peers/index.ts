import { tl } from '@mtcute/core'

import { Chat } from './chat'
import { User } from './user'

export * from './chat'
export * from './chat-event'
export * from './chat-invite-link'
export * from './chat-invite-link-member'
export * from './chat-location'
export * from './chat-member'
export * from './chat-permissions'
export * from './chat-photo'
export * from './chat-preview'
export * from './forum-topic'
export * from './peers-index'
export * from './typing-status'
export * from './user'

/**
 * More extensive peer types, that differentiate between
 * users and bots, channels and supergroups.
 */
export type PeerType = 'user' | 'bot' | 'group' | 'channel' | 'supergroup'

/**
 * Type that can be used as an input peer to most of the high-level methods. Can be:
 *  - `number`, representing peer's marked ID*
 *  - `string`, representing peer's username (without preceding `@`)
 *  - `string`, representing user's phone number
 *  - `"me"` and `"self"` which will be replaced with the current user/bot
 *  - `Chat` or `User` object
 *  - Raw TL object
 *
 * > * Telegram has moved to int64 IDs. Though, Levin [has confirmed](https://t.me/tdlibchat/25071)
 * > that new IDs *will* still fit into int53, meaning JS integers are fine.
 */
export type InputPeerLike =
    | string
    | number
    | tl.TypePeer
    | tl.TypeInputPeer
    | tl.TypeInputUser
    | tl.TypeInputChannel
    | Chat
    | User
