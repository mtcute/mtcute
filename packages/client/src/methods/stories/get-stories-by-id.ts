import { MaybeArray } from '@mtcute/core'
import { assertTypeIs } from '@mtcute/core/utils'

import { TelegramClient } from '../../client'
import { InputPeerLike, PeersIndex, Story } from '../../types'

/**
 * Get a single story by its ID
 *
 * @param peerId  Peer ID whose stories to fetch
 * @param storyId  Story ID
 * @internal
 */
export async function getStoriesById(this: TelegramClient, peerId: InputPeerLike, storyId: number): Promise<Story>

/**
 * Get multiple stories by their IDs
 *
 * @param peerId  Peer ID whose stories to fetch
 * @param storyIds  Story IDs
 * @internal
 */
export async function getStoriesById(this: TelegramClient, peerId: InputPeerLike, storyIds: number[]): Promise<Story[]>

/**
 * @internal
 */
export async function getStoriesById(
    this: TelegramClient,
    peerId: InputPeerLike,
    storyIds: MaybeArray<number>,
): Promise<MaybeArray<Story>> {
    const single = !Array.isArray(storyIds)
    if (single) storyIds = [storyIds as number]

    const res = await this.call({
        _: 'stories.getStoriesByID',
        peer: await this.resolvePeer(peerId),
        id: storyIds as number[],
    })

    const peers = PeersIndex.from(res)

    const stories = res.stories.map((it) => {
        assertTypeIs('getProfileStories', it, 'storyItem')

        return new Story(this, it, peers)
    })

    return single ? stories[0] : stories
}
