import { TelegramClient } from '../../client'
import { PeerStories } from '../../types'

/**
 * Iterate over all stories (e.g. to load the top bar)
 *
 * Wrapper over {@link getAllStories}
 *
 * @internal
 */
export async function* iterAllStories(
    this: TelegramClient,
    params?: {
        /**
         * Offset from which to start fetching stories
         */
        offset?: string

        /**
         * Maximum number of stories to fetch
         *
         * @default  Infinity
         */
        limit?: number

        /**
         * Whether to fetch stories from "archived" (or "hidden") peers
         */
        archived?: boolean
    },
): AsyncIterableIterator<PeerStories> {
    if (!params) params = {}

    const { archived, limit = Infinity } = params
    let { offset } = params
    let current = 0

    for (;;) {
        const res = await this.getAllStories({
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
