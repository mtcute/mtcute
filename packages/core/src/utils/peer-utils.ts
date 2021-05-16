import { tl } from '@mtcute/tl'
import { BasicPeerType, PeerType } from '../types'

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
        switch (peerType) {
            case 'user':
            case 'bot':
                return peer
            case 'chat':
            case 'group':
                return -peer
            case 'channel':
            case 'supergroup':
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
 * Convert {@link PeerType} to {@link BasicPeerType}
 */
export function peerTypeToBasic(type: PeerType): BasicPeerType {
    switch (type) {
        case 'bot':
        case 'user':
            return 'user'
        case 'group':
            return 'chat'
        case 'channel':
        case 'supergroup':
            return 'channel'
    }
}

function comparePeers(
    first: tl.TypePeer | undefined,
    second: tl.TypePeer | tl.TypeUser | tl.TypeChat
): boolean {
    if (!first) return false

    if ('userId' in first) {
        if ('userId' in second) return first.userId === second.userId
        switch (second._) {
            case 'user':
            case 'userEmpty':
                return first.userId === second.id
        }
    }
    if ('chatId' in first) {
        if ('chatId' in second) return first.chatId === second.chatId
        switch (second._) {
            case 'chat':
            case 'chatForbidden':
            case 'chatEmpty':
                return first.chatId === second.id
        }
    }
    if ('channelId' in first) {
        if ('channelId' in second) return first.channelId === second.channelId
        switch (second._) {
            case 'channel':
            case 'channelForbidden':
                return first.channelId === second.id
        }
    }
    return false
}

function isRefMessage(msg: tl.TypeMessage, peer: any): boolean | undefined {
    return (
        comparePeers(msg.peerId, peer) ||
        ('fromId' in msg && comparePeers(msg.fromId, peer)) ||
        ('fwdFrom' in msg &&
            msg.fwdFrom &&
            comparePeers(msg.fwdFrom.fromId, peer)) ||
        ('replies' in msg &&
            msg.replies &&
            msg.replies.recentRepliers &&
            msg.replies.recentRepliers.some((it) => comparePeers(it, peer)))
    )
}

function findContext(obj: any, peer: any): [number, number] | undefined {
    if (!peer.min) return undefined
    switch (obj._) {
        case 'updates':
        case 'updatesCombined':
        case 'updates.difference':
        case 'updates.differenceSlice':
            for (const upd of (obj.updates ||
                obj.otherUpdates) as tl.TypeUpdate[]) {
                switch (upd._) {
                    case 'updateNewMessage':
                    case 'updateNewChannelMessage':
                    case 'updateEditMessage':
                    case 'updateEditChannelMessage':
                        if (isRefMessage(upd.message, peer)) {
                            return [
                                getMarkedPeerId(upd.message.peerId!),
                                upd.message.id,
                            ]
                        }
                        break
                }
            }
            break
        case 'updateShortMessage':
            return [obj.userId, obj.id]
        case 'updateShortChatMessage':
            return [-obj.chatId, obj.id]
    }

    if ('messages' in obj || 'newMessages' in obj) {
        for (const msg of (obj.messages ||
            obj.newMessages) as tl.TypeMessage[]) {
            if (isRefMessage(msg, peer)) {
                return [getMarkedPeerId(msg.peerId!), msg.id]
            }
        }
    }

    // im not sure if this is exhaustive check or not

    return undefined
}

/**
 * Extracts all (cacheable) entities from a TlObject or a list of them.
 * Only checks `.user`, `.chat`, `.channel`, `.users` and `.chats` properties
 */
export function* getAllPeersFrom(
    obj: any
): Iterable<
    (tl.TypeUser | tl.TypeChat) & { fromMessage: [number, number] | undefined }
> {
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
                if (user.min && !user.bot) {
                    // min seems to be set for @Channel_Bot,
                    // but we don't really need to cache its context
                    // (we don't need to cache it at all, really, but whatever)
                    user.fromMessage = findContext(obj, user)
                }

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
                        if (chat.min) {
                            chat.fromMessage = findContext(obj, chat)
                        }

                        yield chat
                        break
                }
            }
        }
    }
}
