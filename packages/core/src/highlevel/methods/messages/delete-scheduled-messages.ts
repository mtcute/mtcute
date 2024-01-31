import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Delete scheduled messages by their IDs.
 *
 * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`.
 * @param ids  Message(s) ID(s) to delete.
 */
export async function deleteScheduledMessages(
    client: ITelegramClient,
    chatId: InputPeerLike,
    ids: number[],
): Promise<void> {
    const peer = await resolvePeer(client, chatId)

    const res = await client.call({
        _: 'messages.deleteScheduledMessages',
        peer,
        id: ids,
    })

    client.handleClientUpdate(res)
}
