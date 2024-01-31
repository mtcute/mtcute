import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike, StoryViewer } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'
import { getStoryViewers } from './get-story-viewers.js'

/**
 * Iterate over viewers list of a story.
 * Wrapper over {@link getStoryViewers}
 */
export async function* iterStoryViewers(
    client: ITelegramClient,
    peerId: InputPeerLike,
    storyId: number,
    params?: Parameters<typeof getStoryViewers>[3] & {
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

    const peer = await resolvePeer(client, peerId)

    for (;;) {
        const res = await getStoryViewers(client, peer, storyId, {
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
