import { tl } from '@mtcute/core'

import { Chat } from './chat.js'
import { User } from './user.js'

export * from './chat.js'
export * from './chat-event/index.js'
export * from './chat-invite-link.js'
export * from './chat-invite-link-member.js'
export * from './chat-location.js'
export * from './chat-member.js'
export * from './chat-permissions.js'
export * from './chat-photo.js'
export * from './chat-preview.js'
export * from './forum-topic.js'
export * from './peers-index.js'
export * from './typing-status.js'
export * from './user.js'

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
