import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike, PeersIndex, PeerStories } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Get stories of a given peer
 *
 * @param peerId  Peer ID whose stories to fetch
 */
export async function getPeerStories(client: ITelegramClient, peerId: InputPeerLike): Promise<PeerStories> {
    const res = await client.call({
        _: 'stories.getPeerStories',
        peer: await resolvePeer(client, peerId),
    })

    const peers = PeersIndex.from(res)

    return new PeerStories(res.stories, peers)
}
