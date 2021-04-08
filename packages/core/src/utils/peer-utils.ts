import { tl } from '@mtcute/tl'
import { BasicPeerType, MaybeArray, PeerType } from '../types'

export const MIN_CHANNEL_ID = -1002147483647
export const MAX_CHANNEL_ID = -1000000000000
export const MIN_CHAT_ID = -2147483647
export const MAX_USER_ID = 2147483647

/**
 * Get the bare (non-marked) ID from a {@link tl.TypePeer}
 */
export function getBarePeerId(peer: tl.TypePeer): number {
    if (peer._ === 'peerUser') return peer.userId
    if (peer._ === 'peerChat') return peer.chatId
    if (peer._ === 'peerChannel') return peer.channelId

    throw new Error('Invalid peer')
}

/**
 * Get the marked (non-bare) ID from a {@link tl.TypePeer}
 *
 * *Mark* is bot API compatible, which is:
 * - ID stays the same for users
 * - ID is negated for chats
 * - ID is negated and `1e12` is subtracted for channels
 */
export function getMarkedPeerId(
    peerId: number,
    peerType: BasicPeerType | PeerType
): number
export function getMarkedPeerId(peer: tl.TypePeer | tl.TypeInputPeer): number
export function getMarkedPeerId(
    peer: tl.TypePeer | tl.TypeInputPeer | number,
    peerType?: BasicPeerType | PeerType
): number {
    if (typeof peer === 'number') {
        if (peerType === 'user' || peerType === 'bot') return peer
        if (peerType === 'chat' || peerType === 'group') return -peer
        if (peerType === 'channel' || peerType === 'supergroup')
            return MAX_CHANNEL_ID - peer
        throw new Error('Invalid peer type')
    }

    if (peer._ === 'peerUser' || peer._ === 'inputPeerUser') return peer.userId
    if (peer._ === 'peerChat' || peer._ === 'inputPeerChat') return -peer.chatId
    if (peer._ === 'peerChannel' || peer._ === 'inputPeerChannel')
        return MAX_CHANNEL_ID - peer.channelId

    throw new Error('Invalid peer')
}

/**
 * Extract basic peer type from {@link tl.TypePeer} or its marked ID.
 */
export function getBasicPeerType(peer: tl.TypePeer | number): BasicPeerType {
    if (typeof peer !== 'number') {
        if (peer._ === 'peerUser') return 'user'
        if (peer._ === 'peerChat') return 'chat'
        if (peer._ === 'peerChannel') return 'channel'

        throw new Error('Invalid peer')
    }

    if (peer < 0) {
        if (MIN_CHAT_ID <= peer) return 'chat'
        if (MIN_CHANNEL_ID <= peer && peer < MAX_CHANNEL_ID) return 'channel'
    } else if (0 < peer && peer <= MAX_USER_ID) {
        return 'user'
    }

    throw new Error(`Invalid marked peer id: ${peer}`)
}

export function markedPeerIdToBare(peerId: number): number {
    const type = getBasicPeerType(peerId)
    if (type === 'user') return peerId
    else if (type === 'chat') return -peerId
    else if (type === 'channel') return MAX_CHANNEL_ID - peerId

    throw new Error('Invalid marked peer id')
}

/**
 * Convert {@link PeerType} to {@link BasicPeerType}
 */
export function peerTypeToBasic(type: PeerType): BasicPeerType {
    if (type === 'bot' || type === 'user') return 'user'
    if (type === 'group') return 'chat'
    if (type === 'channel' || type === 'supergroup') return 'channel'

    throw new Error('Invalid peer type')
}

/**
 * Extracts all (cacheable) entities from a TlObject or a list of them.
 * Only checks `.user`, `.chat`, `.channel`, `.users` and `.chats` properties
 */
export function* getAllPeersFrom(
    objects: MaybeArray<any>
): Iterable<
    | tl.RawUser
    | tl.RawChat
    | tl.RawChatForbidden
    | tl.RawChannel
    | tl.RawChannelForbidden
> {
    if (!Array.isArray(objects)) objects = [objects]

    for (const obj of objects) {
        if (typeof obj !== 'object') continue

        if (
            'user' in obj &&
            typeof obj.user === 'object' &&
            obj.user._ === 'user'
        ) {
            yield obj.user
        }

        if (
            'chat' in obj &&
            typeof obj.chat === 'object' &&
            (obj.chat._ === 'chat' ||
                obj.chat._ === 'channel' ||
                obj.chat._ === 'chatForbidden' ||
                obj.chat._ === 'channelForbidden')
        ) {
            yield obj.chat
        }

        if (
            'channel' in obj &&
            typeof obj.channel === 'object' &&
            (obj.channel._ === 'chat' ||
                obj.channel._ === 'channel' ||
                obj.channel._ === 'chatForbidden' ||
                obj.channel._ === 'channelForbidden')
        ) {
            yield obj.channel
        }

        if ('users' in obj && Array.isArray(obj.users) && obj.users.length) {
            for (const user of obj.users) {
                // .users is sometimes number[]
                if (typeof user === 'object' && user._ === 'user') yield user
            }
        }

        if ('chats' in obj && Array.isArray(obj.chats) && obj.chats.length) {
            for (const chat of obj.chats) {
                // .chats is sometimes number[]
                if (
                    typeof chat === 'object' &&
                    (chat._ === 'chat' ||
                        chat._ === 'channel' ||
                        chat._ === 'chatForbidden' ||
                        chat._ === 'channelForbidden')
                )
                    yield chat
            }
        }
    }
}
