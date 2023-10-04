import { TelegramClient } from '../../client'
import { InputPeerLike, StoryViewer } from '../../types'

/**
 * Iterate over viewers list of a story.
 * Wrapper over {@link getStoryViewers}
 *
 * @internal
 */
export async function* iterStoryViewers(
    this: TelegramClient,
    peerId: InputPeerLike,
    storyId: number,
    params?: Parameters<TelegramClient['getStoryViewers']>[2] & {
        /**
         * Total number of viewers to fetch
         *
         * @default  Infinity, i.e. fetch all viewers
         */
        limit?: number

        /**
         * Number of viewers to fetch per request.
         * Usually you don't need to change this.
         *
         * @default  100
         */
        chunkSize?: number
    },
): AsyncIterableIterator<StoryViewer> {
    if (!params) params = {}

    const { onlyContacts, sortBy = 'reaction', query, limit = Infinity, chunkSize = 100 } = params

    let { offset = '' } = params
    let current = 0

    const peer = await this.resolvePeer(peerId)

    for (;;) {
        const res = await this.getStoryViewers(peer, storyId, {
            onlyContacts,
            sortBy,
            query,
            offset,
            limit: Math.min(limit - current, chunkSize),
        })

        for (const peer of res.viewers) {
            yield peer

            if (++current >= limit) return
        }

        if (!res.next) return
        offset = res.next
    }
}
