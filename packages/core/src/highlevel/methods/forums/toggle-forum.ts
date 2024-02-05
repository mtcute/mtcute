import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike } from '../../types/index.js'
import { resolveChannel } from '../users/resolve-peer.js'

/**
 * Set whether a supergroup is a forum.
 *
 * Only owner of the supergroup can change this setting.
 *
 * @param chatId  Chat ID or username
 * @param enabled  Whether the supergroup should be a forum
 */
export async function toggleForum(client: ITelegramClient, chatId: InputPeerLike, enabled = false): Promise<void> {
    const res = await client.call({
        _: 'channels.toggleForum',
        channel: await resolveChannel(client, chatId),
        enabled,
    })
    client.handleClientUpdate(res)
}
