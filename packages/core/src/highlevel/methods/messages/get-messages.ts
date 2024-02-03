import { tl } from '@mtcute/tl'

import { MaybeArray } from '../../../types/utils.js'
import { assertTypeIsNot } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'
import { Message } from '../../types/messages/index.js'
import { InputPeerLike, PeersIndex } from '../../types/peers/index.js'
import { isInputPeerChannel, toInputChannel } from '../../utils/peer-utils.js'
import { resolvePeer } from '../users/resolve-peer.js'

// @available=both
/**
 * Get messages in chat by their IDs
 *
 * Fot messages that were not found, `null` will be
 * returned at that position.
 *
 * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`
 * @param messageIds  Messages IDs
 * @param [fromReply=false]
 *     Whether the reply to a given message should be fetched
 *     (i.e. `getMessages(msg.chat.id, msg.id, true).id === msg.replyToMessageId`)
 */
export async function getMessages(
    client: ITelegramClient,
    chatId: InputPeerLike,
    messageIds: MaybeArray<number>,
    fromReply = false,
): Promise<(Message | null)[]> {
    const peer = await resolvePeer(client, chatId)
    if (!Array.isArray(messageIds)) messageIds = [messageIds]

    const type = fromReply ? 'inputMessageReplyTo' : 'inputMessageID'
    const ids: tl.TypeInputMessage[] = messageIds.map((it) => ({
        _: type,
        id: it,
    }))

    const isChannel = isInputPeerChannel(peer)

    const res = await client.call(
        isChannel ?
            {
                _: 'channels.getMessages',
                id: ids,
                channel: toInputChannel(peer),
            } :
            {
                _: 'messages.getMessages',
                id: ids,
            },
    )

    assertTypeIsNot('getMessages', res, 'messages.messagesNotModified')

    const peers = PeersIndex.from(res)

    let selfId: number | null | undefined = undefined

    return res.messages.map((msg) => {
        if (msg._ === 'messageEmpty') return null

        if (!isChannel) {
            // make sure that the messages belong to the given chat
            // (channels have their own message numbering)
            switch (peer._) {
                case 'inputPeerSelf':
                    if (selfId === undefined) selfId = client.storage.self.getCached()?.userId ?? null

                    if (!(msg.peerId._ === 'peerUser' && msg.peerId.userId === selfId)) {
                        return null
                    }
                    break
                case 'inputPeerUser':
                case 'inputPeerUserFromMessage':
                    if (!(msg.peerId._ === 'peerUser' && msg.peerId.userId === peer.userId)) {
                        return null
                    }
                    break
                case 'inputPeerChat':
                    if (!(msg.peerId._ === 'peerChat' && msg.peerId.chatId === peer.chatId)) {
                        return null
                    }
                    break
            }
        }

        return new Message(msg, peers)
    })
}
