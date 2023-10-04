import { assertTypeIs } from '@mtcute/core/utils'

import { TelegramClient } from '../../client'
import { ArrayPaginated, InputPeerLike, PeersIndex, Story } from '../../types'
import { makeArrayPaginated } from '../../utils'

/**
 * Get profile stories
 *
 * @internal
 */
export async function getProfileStories(
    this: TelegramClient,
    peerId: InputPeerLike,
    params?: {
        /**
         * Kind of stories to fetch
         * - `pinned` - stories pinned to the profile and visible to everyone
         * - `archived` - "archived" stories that can later be pinned, only visible to the owner
         *
         * @default  `pinned`
         */
        kind?: 'pinned' | 'archived'

        /**
         * Offset ID for pagination
         */
        offsetId?: number

        /**
         * Maximum number of stories to fetch
         *
         * @default  100
         */
        limit?: number
    },
): Promise<ArrayPaginated<Story, number>> {
    if (!params) params = {}

    const { kind = 'pinned', offsetId = 0, limit = 100 } = params

    const res = await this.call({
        _: kind === 'pinned' ? 'stories.getPinnedStories' : 'stories.getStoriesArchive',
        peer: await this.resolvePeer(peerId),
        offsetId,
        limit,
    })

    const peers = PeersIndex.from(res)

    const stories = res.stories.map((it) => {
        assertTypeIs('getProfileStories', it, 'storyItem')

        return new Story(this, it, peers)
    })
    const last = stories[stories.length - 1]
    const next = last?.id

    return makeArrayPaginated(stories, res.count, next)
}
