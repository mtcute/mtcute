import { tl } from '@mtcute/tl'

import { Chat } from './chat.js'
import { PeersIndex } from './peers-index.js'
import { User } from './user.js'

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
 *  - Any object with `inputPeer: tl.TypeInputPeer` property
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
    | { inputPeer: tl.TypeInputPeer }

/**
 * Peer (a user or a chat)
 *
 * Type of the peer can be determined by the `.type` property
 */
export type Peer = User | Chat

/**
 * An object representing an anonymous sender (e.g. for users that have forwards hidden)
 */
export interface AnonymousSender {
    readonly type: 'anonymous'

    /**
     * Name of the anonymous sender that should be displayed
     */
    readonly displayName: string
}

/**
 * Object representing a sender of a forwarded message,
 * which can be either a {@link Peer} or an {@link AnonymousSender}
 */
export type PeerSender = Peer | AnonymousSender

/**
 * Given a `tl.TypePeer`, return a {@link Peer} object ({@link User} or {@link Chat})
 */
export function parsePeer(peer: tl.TypePeer, index: PeersIndex): Peer {
    switch (peer._) {
        case 'peerUser':
            return new User(index.user(peer.userId))
        case 'peerChat':
            return new Chat(index.chat(peer.chatId))
        case 'peerChannel':
            return new Chat(index.chat(peer.channelId))
    }
}
