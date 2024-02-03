import { assertTypeIs } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'
import { ArrayPaginated, InputPeerLike, PeersIndex, Story } from '../../types/index.js'
import { makeArrayPaginated } from '../../utils/index.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Get profile stories
 */
export async function getProfileStories(
    client: ITelegramClient,
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

    const res = await client.call({
        _: kind === 'pinned' ? 'stories.getPinnedStories' : 'stories.getStoriesArchive',
        peer: await resolvePeer(client, peerId),
        offsetId,
        limit,
    })

    const peers = PeersIndex.from(res)

    const stories = res.stories.map((it) => {
        assertTypeIs('getProfileStories', it, 'storyItem')

        return new Story(it, peers)
    })
    const last = stories[stories.length - 1]
    const next = last?.id

    return makeArrayPaginated(stories, res.count, next)
}
