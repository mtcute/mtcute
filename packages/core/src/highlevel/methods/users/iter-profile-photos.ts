import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike, Photo } from '../../types/index.js'
import { getProfilePhotos } from './get-profile-photos.js'
import { resolveUser } from './resolve-peer.js'

/**
 * Iterate over profile photos
 *
 * @param userId  User ID, username, phone number, `"me"` or `"self"`
 * @param params
 */
export async function* iterProfilePhotos(
    client: ITelegramClient,
    userId: InputPeerLike,
    params?: Parameters<typeof getProfilePhotos>[2] & {
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

    const peer = await resolveUser(client, userId)

    const { limit = Infinity, chunkSize = 100 } = params

    let { offset } = params
    let current = 0

    for (;;) {
        const res = await getProfilePhotos(client, peer, {
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
