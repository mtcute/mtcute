import { BaseTelegramClient, MaybeArray } from '@mtcute/core'

import { InputPeerLike, PeersIndex, StoryInteractions } from '../../types'
import { resolvePeer } from '../users/resolve-peer'

/**
 * Get brief information about stories interactions.
 *
 * The result will be in the same order as the input IDs
 */
export async function getStoriesInteractions(
    client: BaseTelegramClient,
    peerId: InputPeerLike,
    storyIds: MaybeArray<number>,
): Promise<StoryInteractions[]> {
    if (!Array.isArray(storyIds)) storyIds = [storyIds]

    const res = await client.call({
        _: 'stories.getStoriesViews',
        peer: await resolvePeer(client, peerId),
        id: storyIds,
    })

    const peers = PeersIndex.from(res)

    const infos = res.views.map((it) => new StoryInteractions(it, peers))

    return infos
}
