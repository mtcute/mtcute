import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'
import { Booster } from '../../types/stories/booster'

/**
 * Iterate over boosters of a channel.
 *
 * Wrapper over {@link getBoosters}
 *
 * @returns  IDs of stories that were removed
 * @internal
 */
export async function* iterBoosters(
    this: TelegramClient,
    peerId: InputPeerLike,
    params?: Parameters<TelegramClient['getBoosters']>[1] & {
        /**
         * Total number of boosters to fetch
         *
         * @default  Infinity, i.e. fetch all boosters
         */
        limit?: number

        /**
         * Number of boosters to fetch per request
         * Usually you don't need to change this
         *
         * @default  100
         */
        chunkSize?: number
    },
): AsyncIterableIterator<Booster> {
    if (!params) params = {}
    const { limit = Infinity, chunkSize = 100 } = params

    let { offset } = params
    let current = 0

    const peer = await this.resolvePeer(peerId)

    for (;;) {
        const res = await this.getBoosters(peer, {
            offset,
            limit: Math.min(limit - current, chunkSize),
        })

        for (const booster of res) {
            yield booster

            if (++current >= limit) return
        }

        if (!res.next) return
        offset = res.next
    }
}
