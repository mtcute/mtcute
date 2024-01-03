import { parseMarkedPeerId, tl } from '@mtcute/core'

export function markedIdToPeer(id: number): tl.TypePeer {
    const [type, bareId] = parseMarkedPeerId(id)

    switch (type) {
        case 'user':
            return { _: 'peerUser', userId: bareId }
        case 'chat':
            return { _: 'peerChat', chatId: bareId }
        case 'channel':
            return { _: 'peerChannel', channelId: bareId }
    }
}
