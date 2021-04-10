import { tl } from '@mtcute/tl'

export const INVITE_LINK_REGEX = /^(?:https?:\/\/)?(?:www\.)?(?:t(?:elegram)?\.(?:org|me|dog)\/joinchat\/)([\w-]+)$/i


// helpers to normalize result of `resolvePeer` function

export function normalizeToInputPeer(
    res: tl.TypeInputPeer | tl.TypeInputUser | tl.TypeInputChannel
): tl.TypeInputPeer {
    if (tl.isAnyInputPeer(res)) return res

    if (res._ === 'inputChannelEmpty' || res._ === 'inputUserEmpty') {
        return { _: 'inputPeerEmpty' }
    }

    if (res._ === 'inputUser') {
        return { ...res, _: 'inputPeerUser' }
    }

    if (res._ === 'inputUserSelf') {
        return { _: 'inputPeerSelf' }
    }

    if (res._ === 'inputChannel') {
        return { ...res, _: 'inputPeerChannel' }
    }

    if (res._ === 'inputChannelFromMessage') {
        return { ...res, _: 'inputPeerChannelFromMessage' }
    }

    if (res._ === 'inputUserFromMessage') {
        return { ...res, _: 'inputPeerUserFromMessage' }
    }

    return res as never
}

export function normalizeToInputUser(
    res: tl.TypeInputPeer | tl.TypeInputUser | tl.TypeInputChannel
): tl.TypeInputUser | null {
    if (tl.isAnyInputUser(res)) return res

    if (res._ === 'inputPeerUser') {
        return { ...res, _: 'inputUser' }
    }

    if (res._ === 'inputPeerUserFromMessage') {
        return { ...res, _: 'inputUserFromMessage' }
    }

    return null
}

export function normalizeToInputChannel(
    res: tl.TypeInputPeer | tl.TypeInputUser | tl.TypeInputChannel
): tl.TypeInputChannel | null {
    if (tl.isAnyInputChannel(res)) return res

    if (res._ === 'inputPeerChannel') {
        return { ...res, _: 'inputChannel' }
    }

    if (res._ === 'inputPeerChannelFromMessage') {
        return { ...res, _: 'inputChannelFromMessage' }
    }

    return null
}

export function inputPeerToPeer(inp: tl.TypeInputPeer): tl.TypePeer {
    if (inp._ === 'inputPeerUser' || inp._ === 'inputPeerUserFromMessage')
        return { _: 'peerUser', userId: inp.userId }

    if (inp._ === 'inputPeerChannel' || inp._ === 'inputPeerChannelFromMessage')
        return { _: 'peerChannel', channelId: inp.channelId }

    if (inp._ === 'inputPeerChat') return { _: 'peerChat', chatId: inp.chatId }

    return inp as never
}

export function createUsersChatsIndex(obj: { users: tl.TypeUser[], chats: tl.TypeChat[] }): {
    users: Record<number, tl.TypeUser>
    chats: Record<number, tl.TypeChat>
} {
    const users: Record<number, tl.TypeUser> = {}
    const chats: Record<number, tl.TypeChat> = {}
    obj.users.forEach((e) => (users[e.id] = e))
    obj.chats.forEach((e) => (chats[e.id] = e))

    return { users, chats }
}
