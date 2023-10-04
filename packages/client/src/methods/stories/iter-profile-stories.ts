import { TelegramClient } from '../../client'
import { InputPeerLike, Story } from '../../types'

/**
 * Iterate over profile stories. Wrapper over {@link getProfileStories}
 *
 * @internal
 */
export async function* iterProfileStories(
    this: TelegramClient,
    peerId: InputPeerLike,
    params?: Parameters<TelegramClient['getProfileStories']>[1] & {
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

    const peer = await this.resolvePeer(peerId)

    for (;;) {
        const res = await this.getProfileStories(peer, {
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
