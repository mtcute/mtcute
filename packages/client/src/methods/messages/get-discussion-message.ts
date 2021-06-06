import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'
import { tl } from '@mtcute/tl'

/** @internal */
export async function _getDiscussionMessage(
    this: TelegramClient,
    peer: InputPeerLike,
    message: number
): Promise<[tl.TypeInputPeer, number]> {
    const inputPeer = await this.resolvePeer(peer)

    const res = await this.call({
        _: 'messages.getDiscussionMessage',
        peer: inputPeer,
        msgId: message,
    })

    if (!res.messages.length || res.messages[0]._ === 'messageEmpty')
        // no discussion message (i guess?), return the same msg
        return [inputPeer, message]

    const msg = res.messages[0]
    const chat = res.chats.find(
        (it) => it.id === (msg.peerId as tl.RawPeerChannel).channelId
    )! as tl.RawChannel

    return [
        {
            _: 'inputPeerChannel',
            channelId: chat.id,
            accessHash: chat.accessHash!,
        },
        msg.id,
    ]
}
