import { ITelegramClient } from '../../client.types.js'
import { PeerStories } from '../../types/index.js'
import { getAllStories } from './get-all-stories.js'

/**
 * Iterate over all stories (e.g. to load the top bar)
 *
 * Wrapper over {@link getAllStories}
 */
export async function* iterAllStories(
    client: ITelegramClient,
    params?: Parameters<typeof getAllStories>[1] & {
        /**
         * Maximum number of stories to fetch
         *
         * @default  Infinity
         */
        limit?: number
    },
): AsyncIterableIterator<PeerStories> {
    if (!params) params = {}

    const { archived, limit = Infinity } = params
    let { offset } = params
    let current = 0

    for (;;) {
        const res = await getAllStories(client, {
            offset,
            archived,
        })

        for (const peer of res.peerStories) {
            yield peer

            if (++current >= limit) return
        }

        if (!res.hasMore) return
        offset = res.next
    }
}
