import { MaybeArray } from '../../../types/utils.js'
import { assertTypeIsNot } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike, Message, PeersIndex } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'

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
    client: ITelegramClient,
    chatId: InputPeerLike,
    messageIds: MaybeArray<number>,
): Promise<(Message | null)[]> {
    const peer = await resolvePeer(client, chatId)
    if (!Array.isArray(messageIds)) messageIds = [messageIds]

    const res = await client.call({
        _: 'messages.getScheduledMessages',
        peer,
        id: messageIds,
    })

    assertTypeIsNot('getScheduledMessages', res, 'messages.messagesNotModified')

    const peers = PeersIndex.from(res)

    const ret = res.messages.map((msg) => {
        if (msg._ === 'messageEmpty') return null

        return new Message(msg, peers, true)
    })

    return ret
}
