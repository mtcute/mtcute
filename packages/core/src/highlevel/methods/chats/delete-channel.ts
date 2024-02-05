import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike } from '../../types/index.js'
import { resolveChannel } from '../users/resolve-peer.js'

// @alias=deleteSupergroup
/**
 * Delete a channel or a supergroup
 *
 * @param chatId  Chat ID or username
 */
export async function deleteChannel(client: ITelegramClient, chatId: InputPeerLike): Promise<void> {
    const res = await client.call({
        _: 'channels.deleteChannel',
        channel: await resolveChannel(client, chatId),
    })
    client.handleClientUpdate(res)
}
