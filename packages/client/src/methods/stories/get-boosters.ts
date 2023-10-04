import { TelegramClient } from '../../client'
import { ArrayPaginated, InputPeerLike, PeersIndex } from '../../types'
import { Booster } from '../../types/stories/booster'
import { makeArrayPaginated } from '../../utils'

/**
 * Get boosters of a channel
 *
 * @returns  IDs of stories that were removed
 * @internal
 */
export async function getBoosters(
    this: TelegramClient,
    peerId: InputPeerLike,
    params?: {
        /**
         * Offset for pagination
         */
        offset?: string

        /**
         * Maximum number of boosters to fetch
         *
         * @default  100
         */
        limit?: number
    },
): Promise<ArrayPaginated<Booster, string>> {
    const { offset = '', limit = 100 } = params ?? {}

    const res = await this.call({
        _: 'stories.getBoostersList',
        peer: await this.resolvePeer(peerId),
        offset,
        limit,
    })

    const peers = PeersIndex.from(res)

    return makeArrayPaginated(
        res.boosters.map((it) => new Booster(this, it, peers)),
        res.count,
        res.nextOffset,
    )
}
