import { tl } from '@mtcute/tl'

import { assertNever } from '../../types/utils.js'
import { MtInvalidPeerTypeError } from '../types/errors.js'
import { InputPeerLike } from '../types/peers/index.js'

export const INVITE_LINK_REGEX =
    /^(?:https?:\/\/)?(?:www\.)?(?:t(?:elegram)?\.(?:org|me|dog)\/(?:joinchat\/|\+))([\w-]+)$/i

// helpers to convert result of `resolvePeer` function

export function toInputPeer(res: tl.TypeInputPeer | tl.TypeInputUser | tl.TypeInputChannel): tl.TypeInputPeer {
    if (tl.isAnyInputPeer(res)) return res

    switch (res._) {
        case 'inputChannelEmpty':
        case 'inputUserEmpty':
            return { _: 'inputPeerEmpty' }
        case 'inputUser':
            return {
                _: 'inputPeerUser',
                userId: res.userId,
                accessHash: res.accessHash,
            }
        case 'inputUserSelf':
            return { _: 'inputPeerSelf' }
        case 'inputChannel':
            return {
                _: 'inputPeerChannel',
                channelId: res.channelId,
                accessHash: res.accessHash,
            }
        case 'inputChannelFromMessage':
            return {
                _: 'inputPeerChannelFromMessage',
                channelId: res.channelId,
                msgId: res.msgId,
                peer: res.peer,
            }
        case 'inputUserFromMessage':
            return {
                _: 'inputPeerUserFromMessage',
                userId: res.userId,
                msgId: res.msgId,
                peer: res.peer,
            }
        default:
            assertNever(res)
    }
}

export function toInputUser(
    res: tl.TypeInputPeer | tl.TypeInputUser | tl.TypeInputChannel,
    input?: InputPeerLike,
): tl.TypeInputUser {
    if (tl.isAnyInputUser(res)) return res

    switch (res._) {
        case 'inputPeerSelf':
            return { _: 'inputUserSelf' }
        case 'inputPeerUser':
            return {
                _: 'inputUser',
                userId: res.userId,
                accessHash: res.accessHash,
            }
        case 'inputPeerUserFromMessage':
            return {
                _: 'inputUserFromMessage',
                userId: res.userId,
                msgId: res.msgId,
                peer: res.peer,
            }
    }

    throw new MtInvalidPeerTypeError(input ?? res, 'user')
}

export function toInputChannel(
    res: tl.TypeInputPeer | tl.TypeInputUser | tl.TypeInputChannel,
    input?: InputPeerLike,
): tl.TypeInputChannel {
    if (tl.isAnyInputChannel(res)) return res

    switch (res._) {
        case 'inputPeerChannel':
            return {
                _: 'inputChannel',
                channelId: res.channelId,
                accessHash: res.accessHash,
            }
        case 'inputPeerChannelFromMessage':
            return {
                _: 'inputChannelFromMessage',
                channelId: res.channelId,
                msgId: res.msgId,
                peer: res.peer,
            }
    }

    throw new MtInvalidPeerTypeError(input ?? res, 'channel')
}

export function isInputPeerUser(
    obj: tl.TypeInputPeer,
): obj is tl.RawInputPeerUser | tl.RawInputPeerUserFromMessage | tl.RawInputPeerSelf {
    switch (obj._) {
        case 'inputPeerUser':
        case 'inputPeerUserFromMessage':
        case 'inputPeerSelf':
            return true
    }

    return false
}

export function isInputPeerChannel(
    obj: tl.TypeInputPeer,
): obj is tl.RawInputPeerChannel | tl.RawInputPeerChannelFromMessage {
    switch (obj._) {
        case 'inputPeerChannel':
        case 'inputPeerChannelFromMessage':
            return true
    }

    return false
}

export function isInputPeerChat(obj: tl.TypeInputPeer): obj is tl.RawInputPeerChat {
    return obj._ === 'inputPeerChat'
}

export function inputPeerToPeer(inp: tl.TypeInputPeer): tl.TypePeer {
    switch (inp._) {
        case 'inputPeerUser':
        case 'inputPeerUserFromMessage':
            return { _: 'peerUser', userId: inp.userId }
        case 'inputPeerChannel':
        case 'inputPeerChannelFromMessage':
            return { _: 'peerChannel', channelId: inp.channelId }
        case 'inputPeerChat':
            return { _: 'peerChat', chatId: inp.chatId }
        default:
            throw new MtInvalidPeerTypeError(inp, `Cannot convert ${inp._} to peer`)
    }
}

export function extractUsernames(obj: tl.RawUser | tl.RawChannel) {
    if (obj.usernames?.length) return obj.usernames.map((x) => x.username.toLowerCase())
    if (obj.username) return [obj.username.toLowerCase()]

    return []
}
