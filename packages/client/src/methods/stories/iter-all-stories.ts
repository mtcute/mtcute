import { BaseTelegramClient } from '@mtcute/core'

import { PeerStories } from '../../types'
import { getAllStories } from './get-all-stories'

/**
 * Iterate over all stories (e.g. to load the top bar)
 *
 * Wrapper over {@link getAllStories}
 */
export async function* iterAllStories(
    client: BaseTelegramClient,
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
