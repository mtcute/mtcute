import { tl } from '@mtcute/core'

export function messageToUpdate(message: tl.TypeMessage): tl.TypeUpdate {
    switch (message.peerId!._) {
        case 'peerUser':
        case 'peerChat':
            return {
                _: 'updateNewMessage',
                message,
                pts: 0,
                ptsCount: 0,
            }
        case 'peerChannel':
            return {
                _: 'updateNewChannelMessage',
                message,
                pts: 0,
                ptsCount: 0,
            }
    }
}

export function extractChannelIdFromUpdate(upd: tl.TypeUpdate): number | undefined {
    // holy shit
    let res = 0

    if ('channelId' in upd) {
        res = upd.channelId
    } else if (
        'message' in upd &&
        typeof upd.message !== 'string' &&
        'peerId' in upd.message &&
        upd.message.peerId &&
        'channelId' in upd.message.peerId
    ) {
        res = upd.message.peerId.channelId
    }

    if (res === 0) return undefined

    return res
}
