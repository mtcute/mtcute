import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Boost a given channel
 *
 * @param peerId  Peer ID to boost
 */
export async function applyBoost(client: ITelegramClient, peerId: InputPeerLike): Promise<void> {
    await client.call({
        _: 'premium.applyBoost',
        peer: await resolvePeer(client, peerId),
    })
}
