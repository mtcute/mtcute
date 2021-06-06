import { tl } from '@mtcute/tl'
import { BasicPeerType } from '../types'

export const MIN_CHANNEL_ID = -1002147483647
export const MAX_CHANNEL_ID = -1000000000000
export const MIN_CHAT_ID = -2147483647
export const MAX_USER_ID = 2147483647

/**
 * Get the bare (non-marked) ID from a {@link tl.TypePeer}
 */
export function getBarePeerId(peer: tl.TypePeer): number {
    switch (peer._) {
        case 'peerUser':
            return peer.userId
        case 'peerChat':
            return peer.chatId
        case 'peerChannel':
            return peer.channelId
    }
}

/**
 * Get the marked (non-bare) ID from a {@link tl.TypePeer}
 *
 * *Mark* is bot API compatible, which is:
 * - ID stays the same for users
 * - ID is negated for chats
 * - ID is negated and `1e12` is subtracted for channels
 */
export function getMarkedPeerId(peerId: number, peerType: BasicPeerType): number
export function getMarkedPeerId(peer: tl.TypePeer | tl.TypeInputPeer): number
export function getMarkedPeerId(
    peer: tl.TypePeer | tl.TypeInputPeer | number,
    peerType?: BasicPeerType
): number {
    if (typeof peer === 'number') {
        switch (peerType) {
            case 'user':
                return peer
            case 'chat':
                return -peer
            case 'channel':
                return MAX_CHANNEL_ID - peer
        }
        throw new Error('Invalid peer type')
    }

    switch (peer._) {
        case 'peerUser':
        case 'inputPeerUser':
            return peer.userId
        case 'peerChat':
        case 'inputPeerChat':
            return -peer.chatId
        case 'peerChannel':
        case 'inputPeerChannel':
            return MAX_CHANNEL_ID - peer.channelId
    }

    throw new Error('Invalid peer')
}

/**
 * Extract basic peer type from {@link tl.TypePeer} or its marked ID.
 */
export function getBasicPeerType(peer: tl.TypePeer | number): BasicPeerType {
    if (typeof peer !== 'number') {
        switch (peer._) {
            case 'peerUser':
                return 'user'
            case 'peerChat':
                return 'chat'
            case 'peerChannel':
                return 'channel'
        }
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
    switch (type) {
        case 'user':
            return peerId
        case 'chat':
            return -peerId
        case 'channel':
            return MAX_CHANNEL_ID - peerId
    }

    throw new Error('Invalid marked peer id')
}

/**
 * Extracts all (cacheable) entities from a TlObject or a list of them.
 * Only checks `.user`, `.chat`, `.channel`, `.users` and `.chats` properties
 */
export function* getAllPeersFrom(
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    obj: any
): Iterable<tl.TypeUser | tl.TypeChat> {
    if (typeof obj !== 'object') return

    switch (obj._) {
        case 'user':
        case 'chat':
        case 'channel':
        case 'chatForbidden':
        case 'channelForbidden':
            yield obj
            return
        case 'userFull':
            yield obj.user
            return
    }

    if (
        'user' in obj &&
        typeof obj.user === 'object' &&
        obj.user._ === 'user'
    ) {
        yield obj.user
    }

    if ('chat' in obj && typeof obj.chat === 'object') {
        switch (obj.chat._) {
            case 'chat':
            case 'channel':
            case 'chatForbidden':
            case 'channelForbidden':
                yield obj.chat
                break
        }
    }

    if ('channel' in obj && typeof obj.channel === 'object') {
        switch (obj.channel._) {
            case 'chat':
            case 'channel':
            case 'chatForbidden':
            case 'channelForbidden':
                yield obj.channel
                break
        }
    }

    if ('users' in obj && Array.isArray(obj.users) && obj.users.length) {
        for (const user of obj.users) {
            // .users is sometimes number[]
            if (typeof user === 'object' && user._ === 'user') {
                yield user
            }
        }
    }

    if ('chats' in obj && Array.isArray(obj.chats) && obj.chats.length) {
        for (const chat of obj.chats) {
            // .chats is sometimes number[]
            if (typeof chat === 'object') {
                switch (chat._) {
                    case 'chat':
                    case 'channel':
                    case 'chatForbidden':
                    case 'channelForbidden':
                        yield chat
                        break
                }
            }
        }
    }
}
