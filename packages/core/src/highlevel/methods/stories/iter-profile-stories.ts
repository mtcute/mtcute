import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike, Story } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'
import { getProfileStories } from './get-profile-stories.js'

/**
 * Iterate over profile stories. Wrapper over {@link getProfileStories}
 */
export async function* iterProfileStories(
    client: ITelegramClient,
    peerId: InputPeerLike,
    params?: Parameters<typeof getProfileStories>[2] & {
        /**
         * Total number of stories to fetch
         *
         * @default  `Infinity`, i.e. fetch all stories
         */
        limit?: number

        /**
         * Number of stories to fetch per request.
         * Usually you shouldn't care about this.
         *
         * @default  100
         */
        chunkSize?: number
    },
): AsyncIterableIterator<Story> {
    if (!params) params = {}

    const { kind = 'pinned', limit = Infinity, chunkSize = 100 } = params

    let { offsetId } = params
    let current = 0

    const peer = await resolvePeer(client, peerId)

    for (;;) {
        const res = await getProfileStories(client, peer, {
            kind,
            offsetId,
            limit: Math.min(limit - current, chunkSize),
        })

        for (const peer of res) {
            yield peer

            if (++current >= limit) return
        }

        if (!res.next) return
        offsetId = res.next
    }
}
