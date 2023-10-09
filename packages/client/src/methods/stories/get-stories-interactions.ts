import { BaseTelegramClient, MaybeArray } from '@mtcute/core'

import { InputPeerLike, PeersIndex, StoryInteractions } from '../../types'
import { resolvePeer } from '../users/resolve-peer'

/**
 * Get brief information about story interactions.
 */
export async function getStoriesInteractions(
    client: BaseTelegramClient,
    peerId: InputPeerLike,
    storyId: number,
): Promise<StoryInteractions>

/**
 * Get brief information about stories interactions.
 *
 * The result will be in the same order as the input IDs
 */
export async function getStoriesInteractions(
    client: BaseTelegramClient,
    peerId: InputPeerLike,
    storyIds: number[],
): Promise<StoryInteractions[]>

/**
 * @internal
 */
export async function getStoriesInteractions(
    client: BaseTelegramClient,
    peerId: InputPeerLike,
    storyIds: MaybeArray<number>,
): Promise<MaybeArray<StoryInteractions>> {
    const isSingle = !Array.isArray(storyIds)
    if (isSingle) storyIds = [storyIds as number]

    const res = await client.call({
        _: 'stories.getStoriesViews',
        peer: await resolvePeer(client, peerId),
        id: storyIds as number[],
    })

    const peers = PeersIndex.from(res)

    const infos = res.views.map((it) => new StoryInteractions(it, peers))

    return isSingle ? infos[0] : infos
}
