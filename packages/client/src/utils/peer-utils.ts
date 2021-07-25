import { tl } from '@mtqt/tl'
import bigInt from 'big-integer'
import { ChatsIndex, UsersIndex } from '../types'

export const INVITE_LINK_REGEX = /^(?:https?:\/\/)?(?:www\.)?(?:t(?:elegram)?\.(?:org|me|dog)\/joinchat\/)([\w-]+)$/i

// helpers to normalize result of `resolvePeer` function

export function normalizeToInputPeer(
    res: tl.TypeInputPeer | tl.TypeInputUser | tl.TypeInputChannel
): tl.TypeInputPeer {
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
    }
}

export function normalizeToInputUser(
    res:
        | tl.TypeInputUser
        | tl.RawInputPeerUser
        | tl.RawInputPeerUserFromMessage
        | tl.RawInputPeerSelf
): tl.TypeInputUser
export function normalizeToInputUser(
    res: tl.TypeInputPeer | tl.TypeInputUser | tl.TypeInputChannel
): tl.TypeInputUser | null
export function normalizeToInputUser(
    res: tl.TypeInputPeer | tl.TypeInputUser | tl.TypeInputChannel
): tl.TypeInputUser | null {
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

    return null
}

export function normalizeToInputChannel(
    res:
        | tl.TypeInputChannel
        | tl.RawInputPeerChannel
        | tl.RawInputPeerChannelFromMessage
): tl.TypeInputChannel
export function normalizeToInputChannel(
    res: tl.TypeInputPeer | tl.TypeInputUser | tl.TypeInputChannel
): tl.TypeInputChannel | null
export function normalizeToInputChannel(
    res: tl.TypeInputPeer | tl.TypeInputUser | tl.TypeInputChannel
): tl.TypeInputChannel | null {
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

    return null
}

export function isInputPeerUser(
    obj: tl.TypeInputPeer
): obj is
    | tl.RawInputPeerUser
    | tl.RawInputPeerUserFromMessage
    | tl.RawInputPeerSelf {
    switch (obj._) {
        case 'inputPeerUser':
        case 'inputPeerUserFromMessage':
        case 'inputPeerSelf':
            return true
    }
    return false
}

export function isInputPeerChannel(
    obj: tl.TypeInputPeer
): obj is tl.RawInputPeerChannel | tl.RawInputPeerChannelFromMessage {
    switch (obj._) {
        case 'inputPeerChannel':
        case 'inputPeerChannelFromMessage':
            return true
    }
    return false
}

export function isInputPeerChat(
    obj: tl.TypeInputPeer
): obj is tl.RawInputPeerChat {
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
            throw new Error(`Cannot convert ${inp._} to peer`)
    }
}

export function peerToInputPeer(
    peer: tl.TypePeer,
    accessHash = bigInt.zero
): tl.TypeInputPeer {
    switch (peer._) {
        case 'peerUser':
            return { _: 'inputPeerUser', userId: peer.userId, accessHash }
        case 'peerChannel':
            return {
                _: 'inputPeerChannel',
                channelId: peer.channelId,
                accessHash,
            }
        case 'peerChat':
            return { _: 'inputPeerChat', chatId: peer.chatId }
    }
}

export function createUsersChatsIndex(
    obj: {
        users?: tl.TypeUser[]
        chats?: tl.TypeChat[]
    },
    second?: {
        users?: tl.TypeUser[]
        chats?: tl.TypeChat[]
    }
): {
    users: UsersIndex
    chats: ChatsIndex
} {
    const users: UsersIndex = {}
    const chats: ChatsIndex = {}
    obj.users?.forEach((e) => (users[e.id] = e))
    obj.chats?.forEach((e) => (chats[e.id] = e))

    if (second) {
        second.users?.forEach((e) => (users[e.id] = e))
        second.chats?.forEach((e) => (chats[e.id] = e))
    }

    return { users, chats }
}
