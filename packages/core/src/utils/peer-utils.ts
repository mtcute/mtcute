import type { tl } from '@mtcute/tl'

import type { BasicPeerType } from '../types/peers.js'
import { MtArgumentError } from '../types/errors.js'
import { assertNever } from '../types/utils.js'

// src: https://github.com/tdlib/td/blob/master/td/telegram/DialogId.h
const ZERO_CHANNEL_ID = -1000000000000
// src: https://github.com/tdlib/td/blob/master/td/telegram/ChatId.h
// const MAX_CHAT_ID = 999999999999
const MIN_MARKED_CHAT_ID = -999999999999 // -MAX_CHAT_ID
// src: https://github.com/tdlib/td/blob/master/td/telegram/UserId.h
// MAX_USER_ID = (1ll << 40) - 1
const MAX_USER_ID = 1099511627775
// src: https://github.com/tdlib/td/blob/master/td/telegram/ChannelId.h

/**
 * Add or remove channel marker from ID
 */
export function toggleChannelIdMark(id: number): number {
    return ZERO_CHANNEL_ID - id
}

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

// src: https://github.com/tdlib/td/blob/master/td/telegram/DialogId.cpp

/**
 * Get the marked (non-bare) ID from a {@link tl.TypePeer}
 *
 * Mark* is bot API compatible, which is:
 * - ID stays the same for users
 * - ID is negated for chats
 * - ID is negated and `-1e12` is subtracted for channels
 */
export function getMarkedPeerId(peerId: number, peerType: BasicPeerType): number
export function getMarkedPeerId(peer: tl.TypePeer | tl.TypeInputPeer | tl.TypeInputUser | tl.TypeInputChannel): number

export function getMarkedPeerId(
    peer: tl.TypePeer | tl.TypeInputPeer | tl.TypeInputUser | tl.TypeInputChannel | number,
    peerType?: BasicPeerType,
): number {
    if (typeof peer === 'number') {
        switch (peerType) {
            case 'user':
                return peer
            case 'chat':
                return -peer
            case 'channel':
                return ZERO_CHANNEL_ID - peer
        }
        throw new MtArgumentError('Invalid peer type')
    }

    switch (peer._) {
        case 'mtcute.dummyInputPeerMinUser':
        case 'peerUser':
        case 'inputPeerUser':
        case 'inputPeerUserFromMessage':
        case 'inputUser':
        case 'inputUserFromMessage':
            return peer.userId
        case 'peerChat':
        case 'inputPeerChat':
            return -peer.chatId
        case 'mtcute.dummyInputPeerMinChannel':
        case 'peerChannel':
        case 'inputPeerChannel':
        case 'inputPeerChannelFromMessage':
        case 'inputChannel':
        case 'inputChannelFromMessage':
            return ZERO_CHANNEL_ID - peer.channelId
    }

    throw new MtArgumentError(`Invalid peer: ${peer._}`)
}

/**
 * Parse a marked ID into a {@link BasicPeerType} and a bare ID
 */
export function parseMarkedPeerId(id: number): [BasicPeerType, number] {
    if (id < 0) {
        if (MIN_MARKED_CHAT_ID <= id) {
            return ['chat', -id]
        }

        if (id !== ZERO_CHANNEL_ID) {
            return ['channel', ZERO_CHANNEL_ID - id]
        }
    } else if (id > 0 && id <= MAX_USER_ID) {
        return ['user', id]
    }

    throw new MtArgumentError(`Invalid marked peer id: ${id}`)
}

/**
 * Extracts all (cacheable) entities from a TlObject or a list of them.
 * Only checks `.user`, `.chat`, `.channel`, `.users` and `.chats` properties
 */
export function* getAllPeersFrom(obj: tl.TlObject | tl.TlObject[]): Iterable<tl.TypeUser | tl.TypeChat> {
    if (typeof obj !== 'object') return

    if (Array.isArray(obj)) {
        for (const it of obj) {
            yield * getAllPeersFrom(it)
        }

        return
    }

    switch (obj._) {
        case 'user':
        case 'chat':
        case 'channel':
        case 'chatForbidden':
        case 'channelForbidden':
            yield obj

            return
    }

    if ('user' in obj && typeof obj.user === 'object' && obj.user._ === 'user') {
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

/** Get the {@link BasicPeerType} of a peer, either by its marked ID or by its TL object */
export function getBasicPeerType(
    id: number | tl.TypePeer | tl.TypeInputPeer | tl.TypeInputUser | tl.TypeInputChannel,
): BasicPeerType {
    // todo: we should probably move it to mtcute
    if (typeof id === 'number') {
        // based on parseMarkedPeerId()
        if (id < 0) {
            if (MIN_MARKED_CHAT_ID <= id) {
                return 'chat'
            }
            if (id !== ZERO_CHANNEL_ID) {
                return 'channel'
            }
        } else if (id > 0 && id <= MAX_USER_ID) {
            return 'user'
        }

        throw new Error(`Invalid marked peer id: ${id}`)
    }

    switch (id._) {
        case 'peerUser':
        case 'inputUser':
        case 'inputUserSelf':
        case 'inputPeerSelf':
        case 'inputUserFromMessage':
        case 'inputPeerUser':
        case 'inputPeerUserFromMessage':
        case 'inputUserEmpty':
        case 'mtcute.dummyInputPeerMinUser':
            return 'user'
        case 'peerChat':
        case 'inputPeerChat':
            return 'chat'
        case 'peerChannel':
        case 'inputChannel':
        case 'inputChannelEmpty':
        case 'mtcute.dummyInputPeerMinChannel':
        case 'inputChannelFromMessage':
        case 'inputPeerChannel':
        case 'inputPeerChannelFromMessage':
            return 'channel'
        case 'inputPeerEmpty':
            throw new Error('Empty peer')
        default:
            assertNever(id)
    }
}
