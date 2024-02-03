import { tl } from '@mtcute/tl'

import { ITelegramClient } from '../../client.types.js'
import { InputMessageId, Message, normalizeInputMessageId } from '../../types/messages/index.js'
import { InputPeerLike, PeersIndex } from '../../types/peers/index.js'
import { resolvePeer } from '../users/resolve-peer.js'

/** @internal */
export async function _getDiscussionMessage(
    client: ITelegramClient,
    peer: InputPeerLike,
    message: number,
): Promise<[tl.TypeInputPeer, number]> {
    const inputPeer = await resolvePeer(client, peer)

    const res = await client.call({
        _: 'messages.getDiscussionMessage',
        peer: inputPeer,
        msgId: message,
    })

    if (!res.messages.length || res.messages[0]._ === 'messageEmpty') {
        // no discussion message (i guess?), return the same msg
        return [inputPeer, message]
    }

    const msg = res.messages[0]
    const chat = res.chats.find((it) => it.id === (msg.peerId as tl.RawPeerChannel).channelId)! as tl.RawChannel

    return [
        {
            _: 'inputPeerChannel',
            channelId: chat.id,
            accessHash: chat.accessHash!,
        },
        msg.id,
    ]
}

// public version of the same method because why not

/**
 * Get discussion message for some channel post.
 *
 * Returns `null` if the post does not have a discussion
 * message.
 *
 * This method might throw `FLOOD_WAIT_X` error in case
 * the discussion message was not *yet* created. Error
 * is usually handled by the client, but if you disabled that,
 * you'll need to handle it manually.
 *
 * @param peer  Channel where the post was found
 * @param message  ID of the channel post
 */
export async function getDiscussionMessage(
    client: ITelegramClient,
    params: InputMessageId,
): Promise<Message | null> {
    const { chatId, message } = normalizeInputMessageId(params)

    const inputPeer = await resolvePeer(client, chatId)

    const res = await client.call({
        _: 'messages.getDiscussionMessage',
        peer: inputPeer,
        msgId: message,
    })

    if (!res.messages.length || res.messages[0]._ === 'messageEmpty') {
        // no discussion message (i guess?), return the same msg
        return null
    }

    const msg = res.messages[0]
    const peers = PeersIndex.from(res)

    return new Message(msg, peers)
}
