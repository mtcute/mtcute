import { TelegramClient } from '../../client'
import { InputPeerLike, StoryViewersList } from '../../types'

/**
 * Get viewers list of a story
 *
 * @internal
 */
export async function getStoryViewers(
    this: TelegramClient,
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

    const res = await this.call({
        _: 'stories.getStoryViewsList',
        peer: await this.resolvePeer(peerId),
        justContacts: onlyContacts,
        reactionsFirst: sortBy === 'reaction',
        q: query,
        id: storyId,
        offset,
        limit,
    })

    return new StoryViewersList(this, res)
}
