import { TelegramClient } from '../../client'
import { InputPeerLike, PeersIndex, PeerStories } from '../../types'

/**
 * Get stories of a given peer
 *
 * @param peerId  Peer ID whose stories to fetch
 * @internal
 */
export async function getPeerStories(this: TelegramClient, peerId: InputPeerLike): Promise<PeerStories> {
    const res = await this.call({
        _: 'stories.getPeerStories',
        peer: await this.resolvePeer(peerId),
    })

    const peers = PeersIndex.from(res)

    return new PeerStories(this, res.stories, peers)
}
