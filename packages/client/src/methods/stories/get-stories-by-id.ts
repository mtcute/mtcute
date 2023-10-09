import { BaseTelegramClient, MaybeArray } from '@mtcute/core'
import { assertTypeIs } from '@mtcute/core/utils'

import { InputPeerLike, PeersIndex, Story } from '../../types'
import { resolvePeer } from '../users/resolve-peer'

/**
 * Get a single story by its ID
 *
 * @param peerId  Peer ID whose stories to fetch
 * @param storyId  Story ID
 */
export async function getStoriesById(client: BaseTelegramClient, peerId: InputPeerLike, storyId: number): Promise<Story>

/**
 * Get multiple stories by their IDs
 *
 * @param peerId  Peer ID whose stories to fetch
 * @param storyIds  Story IDs
 */
export async function getStoriesById(
    client: BaseTelegramClient,
    peerId: InputPeerLike,
    storyIds: number[],
): Promise<Story[]>

/**
 * @internal
 */
export async function getStoriesById(
    client: BaseTelegramClient,
    peerId: InputPeerLike,
    storyIds: MaybeArray<number>,
): Promise<MaybeArray<Story>> {
    const single = !Array.isArray(storyIds)
    if (single) storyIds = [storyIds as number]

    const res = await client.call({
        _: 'stories.getStoriesByID',
        peer: await resolvePeer(client, peerId),
        id: storyIds as number[],
    })

    const peers = PeersIndex.from(res)

    const stories = res.stories.map((it) => {
        assertTypeIs('getProfileStories', it, 'storyItem')

        return new Story(it, peers)
    })

    return single ? stories[0] : stories
}
