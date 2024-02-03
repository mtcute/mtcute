import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike } from '../../types/index.js'
import { createDummyUpdate } from '../../updates/utils.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Mark all reactions in chat as read.
 *
 * @param chatId  Chat ID
 */
export async function readReactions(client: ITelegramClient, chatId: InputPeerLike): Promise<void> {
    const res = await client.call({
        _: 'messages.readReactions',
        peer: await resolvePeer(client, chatId),
    })
    client.handleClientUpdate(createDummyUpdate(res.pts, res.ptsCount))
}
