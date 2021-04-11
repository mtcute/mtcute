import { tl } from '@mtcute/tl'

export * from './user'
export * from './chat'
export * from './chat-preview'
export { InputChatPermissions } from './chat-permissions'
export * from './chat-member'

/**
 * Peer types that have one-to-one relation to tl.Peer* types.
 */
export type BasicPeerType = 'user' | 'chat' | 'channel'

/**
 * More extensive peer types, that differentiate between
 * users and bots, channels and supergroups.
 */
export type PeerType = 'user' | 'bot' | 'group' | 'channel' | 'supergroup'

/**
 * Type that can be used as an input peer
 * to most of the high-level methods. Can be:
 *  - `number`, representing peer's marked ID
 *  - `string`, representing peer's username (w/out preceding `@`)
 *  - `string`, representing user's phone number (only for contacts)
 *  - `"me"` and `"self"` which will be replaced with the current user/bot
 *  - Raw TL object
 */
export type InputPeerLike =
    | string
    | number
    | tl.TypeInputPeer
    | tl.TypeInputUser
    | tl.TypeInputChannel
