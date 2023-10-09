import { BaseTelegramClient } from '@mtcute/core'

import { InputPeerLike, PeersIndex, PeerStories } from '../../types'
import { resolvePeer } from '../users/resolve-peer'

/**
 * Get stories of a given peer
 *
 * @param peerId  Peer ID whose stories to fetch
 */
export async function getPeerStories(client: BaseTelegramClient, peerId: InputPeerLike): Promise<PeerStories> {
    const res = await client.call({
        _: 'stories.getPeerStories',
        peer: await resolvePeer(client, peerId),
    })

    const peers = PeersIndex.from(res)

    return new PeerStories(res.stories, peers)
}
