import { BaseTelegramClient, MaybeArray, tl } from '@mtcute/core'
import { assertTypeIsNot } from '@mtcute/core/utils'

import { Message } from '../../types/messages'
import { InputPeerLike, PeersIndex } from '../../types/peers'
import { isInputPeerChannel, normalizeToInputChannel } from '../../utils/peer-utils'
import { getAuthState } from '../auth/_state'
import { resolvePeer } from '../users/resolve-peer'

/**
 * Get a single message in chat by its ID
 *
 * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`
 * @param messageId  Messages ID
 * @param [fromReply=false]
 *     Whether the reply to a given message should be fetched
 *     (i.e. `getMessages(msg.chat.id, msg.id, true).id === msg.replyToMessageId`)
 */
export async function getMessages(
    client: BaseTelegramClient,
    chatId: InputPeerLike,
    messageId: number,
    fromReply?: boolean,
): Promise<Message | null>
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
    client: BaseTelegramClient,
    chatId: InputPeerLike,
    messageIds: number[],
    fromReply?: boolean,
): Promise<(Message | null)[]>

// @available=both
/** @internal */
export async function getMessages(
    client: BaseTelegramClient,
    chatId: InputPeerLike,
    messageIds: MaybeArray<number>,
    fromReply = false,
): Promise<MaybeArray<Message | null>> {
    const peer = await resolvePeer(client, chatId)

    const isSingle = !Array.isArray(messageIds)
    if (isSingle) messageIds = [messageIds as number]

    const type = fromReply ? 'inputMessageReplyTo' : 'inputMessageID'
    const ids: tl.TypeInputMessage[] = (messageIds as number[]).map((it) => ({
        _: type,
        id: it,
    }))

    const isChannel = isInputPeerChannel(peer)

    const res = await client.call(
        isChannel ?
            {
                _: 'channels.getMessages',
                id: ids,
                channel: normalizeToInputChannel(peer),
            } :
            {
                _: 'messages.getMessages',
                id: ids,
            },
    )

    assertTypeIsNot('getMessages', res, 'messages.messagesNotModified')

    const peers = PeersIndex.from(res)

    let selfId: number | null | undefined = undefined
    const ret = res.messages.map((msg) => {
        if (msg._ === 'messageEmpty') return null

        if (!isChannel) {
            // make sure that the messages belong to the given chat
            // (channels have their own message numbering)
            switch (peer._) {
                case 'inputPeerSelf':
                    if (selfId === undefined) selfId = getAuthState(client).userId

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

    return isSingle ? ret[0] : ret
}
