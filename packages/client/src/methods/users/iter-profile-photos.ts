import { TelegramClient } from '../../client'
import { InputPeerLike, Photo } from '../../types'
import { normalizeToInputUser } from '../../utils/peer-utils'

/**
 * Iterate over profile photos
 *
 * @param userId  User ID, username, phone number, `"me"` or `"self"`
 * @param params
 * @internal
 */
export async function* iterProfilePhotos(
    this: TelegramClient,
    userId: InputPeerLike,
    params?: Parameters<TelegramClient['getProfilePhotos']>[1] & {
        /**
         * Maximum number of items to fetch
         *
         * @default  `Infinity`, i.e. all items are fetched
         */
        limit?: number

        /**
         * Size of chunks which are fetched. Usually not needed.
         *
         * @default  100
         */
        chunkSize?: number
    },
): AsyncIterableIterator<Photo> {
    if (!params) params = {}

    const peer = normalizeToInputUser(await this.resolvePeer(userId), userId)

    const { limit = Infinity, chunkSize = 100 } = params

    let { offset } = params
    let current = 0

    for (;;) {
        const res = await this.getProfilePhotos(peer, {
            offset,
            limit: Math.min(chunkSize, limit - current),
        })

        for (const it of res) {
            yield it

            if (++current >= limit) return
        }

        if (!res.next) return
        offset = res.next
    }
}
