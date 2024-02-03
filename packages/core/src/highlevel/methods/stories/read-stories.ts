import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Mark all stories up to a given ID as read
 *
 * This should only be used for "active" stories ({@link Story#isActive} == false)
 *
 * @param peerId  Peer ID whose stories to mark as read
 * @returns  IDs of the stores that were marked as read
 */
export async function readStories(client: ITelegramClient, peerId: InputPeerLike, maxId: number): Promise<number[]> {
    return client.call({
        _: 'stories.readStories',
        peer: await resolvePeer(client, peerId),
        maxId,
    })
}
