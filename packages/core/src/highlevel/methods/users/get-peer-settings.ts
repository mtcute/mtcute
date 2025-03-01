import type { ITelegramClient } from '../../client.types.js'
import { type InputPeerLike, PeerSettings, PeersIndex } from '../../types/index.js'
import { resolvePeer } from './resolve-peer.js'

/** Get {@link PeerSettings} for a peer */
export async function getPeerSettings(
    client: ITelegramClient,
    peerId: InputPeerLike,
): Promise<PeerSettings> {
    const res = await client.call({
        _: 'messages.getPeerSettings',
        peer: await resolvePeer(client, peerId),
    })

    const peers = PeersIndex.from(res)

    return new PeerSettings(res.settings, peers)
}
