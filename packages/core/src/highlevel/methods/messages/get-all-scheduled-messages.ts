import Long from 'long'

import { assertTypeIsNot } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike, Message, PeersIndex } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Get all scheduled messages in chat
 *
 * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`
 */
export async function getAllScheduledMessages(client: ITelegramClient, chatId: InputPeerLike): Promise<Message[]> {
    const peer = await resolvePeer(client, chatId)

    const res = await client.call({
        _: 'messages.getScheduledHistory',
        peer,
        hash: Long.ZERO,
    })

    assertTypeIsNot('getScheduledMessages', res, 'messages.messagesNotModified')

    const peers = PeersIndex.from(res)

    const ret = res.messages.map((msg) => {
        assertTypeIsNot('getScheduledMessages', msg, 'messageEmpty')

        return new Message(msg, peers, true)
    })

    return ret
}
