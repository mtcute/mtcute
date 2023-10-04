import { MaybeArray } from '@mtcute/core'

import { TelegramClient } from '../../client'
import { InputPeerLike, PeersIndex, StoryInteractions } from '../../types'

/**
 * Get brief information about story interactions.
 *
 * @internal
 */
export async function getStoriesInteractions(
    this: TelegramClient,
    peerId: InputPeerLike,
    storyId: number,
): Promise<StoryInteractions>

/**
 * Get brief information about stories interactions.
 *
 * The result will be in the same order as the input IDs
 *
 * @internal
 */
export async function getStoriesInteractions(
    this: TelegramClient,
    peerId: InputPeerLike,
    storyIds: number[],
): Promise<StoryInteractions[]>

/**
 * @internal
 */
export async function getStoriesInteractions(
    this: TelegramClient,
    peerId: InputPeerLike,
    storyIds: MaybeArray<number>,
): Promise<MaybeArray<StoryInteractions>> {
    const isSingle = !Array.isArray(storyIds)
    if (isSingle) storyIds = [storyIds as number]

    const res = await this.call({
        _: 'stories.getStoriesViews',
        peer: await this.resolvePeer(peerId),
        id: storyIds as number[],
    })

    const peers = PeersIndex.from(res)

    const infos = res.views.map((it) => new StoryInteractions(this, it, peers))

    return isSingle ? infos[0] : infos
}
