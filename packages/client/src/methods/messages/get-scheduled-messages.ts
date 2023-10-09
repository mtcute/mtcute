import { BaseTelegramClient, MaybeArray } from '@mtcute/core'
import { assertTypeIsNot } from '@mtcute/core/utils'

import { InputPeerLike, Message, PeersIndex } from '../../types'
import { resolvePeer } from '../users/resolve-peer'

/**
 * Get a single scheduled message in chat by its ID
 *
 * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`
 * @param messageId  Scheduled message ID
 */
export async function getScheduledMessages(
    client: BaseTelegramClient,
    chatId: InputPeerLike,
    messageId: number,
): Promise<Message | null>
/**
 * Get scheduled messages in chat by their IDs
 *
 * Fot messages that were not found, `null` will be
 * returned at that position.
 *
 * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`
 * @param messageIds  Scheduled messages IDs
 */
export async function getScheduledMessages(
    client: BaseTelegramClient,
    chatId: InputPeerLike,
    messageIds: number[],
): Promise<(Message | null)[]>

/** @internal */
export async function getScheduledMessages(
    client: BaseTelegramClient,
    chatId: InputPeerLike,
    messageIds: MaybeArray<number>,
): Promise<MaybeArray<Message | null>> {
    const peer = await resolvePeer(client, chatId)

    const isSingle = !Array.isArray(messageIds)
    if (isSingle) messageIds = [messageIds as number]

    const res = await client.call({
        _: 'messages.getScheduledMessages',
        peer,
        id: messageIds as number[],
    })

    assertTypeIsNot('getScheduledMessages', res, 'messages.messagesNotModified')

    const peers = PeersIndex.from(res)

    const ret = res.messages.map((msg) => {
        if (msg._ === 'messageEmpty') return null

        return new Message(msg, peers, true)
    })

    return isSingle ? ret[0] : ret
}
