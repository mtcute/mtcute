import { MaybeArray } from '../../../types/utils.js'
import { assertTypeIs } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike, PeersIndex, Story } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Get one or more stories by their IDs
 *
 * @param peerId  Peer ID whose stories to fetch
 * @param storyIds  Story IDs
 */
export async function getStoriesById(
    client: ITelegramClient,
    peerId: InputPeerLike,
    storyIds: MaybeArray<number>,
): Promise<Story[]> {
    if (!Array.isArray(storyIds)) storyIds = [storyIds]

    const res = await client.call({
        _: 'stories.getStoriesByID',
        peer: await resolvePeer(client, peerId),
        id: storyIds,
    })

    const peers = PeersIndex.from(res)

    const stories = res.stories.map((it) => {
        assertTypeIs('getProfileStories', it, 'storyItem')

        return new Story(it, peers)
    })

    return stories
}
