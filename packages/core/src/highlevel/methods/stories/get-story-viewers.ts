import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike, StoryViewersList } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Get viewers list of a story
 */
export async function getStoryViewers(
    client: ITelegramClient,
    peerId: InputPeerLike,
    storyId: number,
    params?: {
        /**
         * Whether to only fetch viewers from contacts
         */
        onlyContacts?: boolean

        /**
         * How to sort the results?
         * - `reaction` - by reaction (viewers who has reacted are first), then by date (newest first)
         * - `date` - by date, newest first
         *
         * @default  `reaction`
         */
        sortBy?: 'reaction' | 'date'

        /**
         * Search query
         */
        query?: string

        /**
         * Offset ID for pagination
         */
        offset?: string

        /**
         * Maximum number of viewers to fetch
         *
         * @default  100
         */
        limit?: number
    },
): Promise<StoryViewersList> {
    if (!params) params = {}

    const { onlyContacts, sortBy = 'reaction', query, offset = '', limit = 100 } = params

    const res = await client.call({
        _: 'stories.getStoryViewsList',
        peer: await resolvePeer(client, peerId),
        justContacts: onlyContacts,
        reactionsFirst: sortBy === 'reaction',
        q: query,
        id: storyId,
        offset,
        limit,
    })

    return new StoryViewersList(res)
}
