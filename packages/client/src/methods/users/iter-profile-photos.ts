import Long from 'long'

import { tl } from '@mtcute/tl'

import { TelegramClient } from '../../client'
import { InputPeerLike, MtInvalidPeerTypeError, Photo } from '../../types'
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
    params?: {
        /**
         * Offset from which to fetch.
         *
         * Defaults to `0`
         */
        offset?: number

        /**
         * Maximum number of items to fetch
         *
         * Defaults to `Infinity`, i.e. all items are fetched
         */
        limit?: number

        /**
         * Size of chunks which are fetched. Usually not needed.
         *
         * Defaults to `100`
         */
        chunkSize?: number

        /**
         * If set, the method will return only photos
         * with IDs less than the set one
         */
        maxId?: tl.Long
    },
): AsyncIterableIterator<Photo> {
    if (!params) params = {}

    const peer = normalizeToInputUser(await this.resolvePeer(userId), userId)

    let offset = params.offset || 0
    let current = 0
    const total = params.limit || Infinity

    const limit = Math.min(params.chunkSize || 100, total)

    const maxId = params.maxId || Long.ZERO

    for (;;) {
        const res = await this.call({
            _: 'photos.getUserPhotos',
            userId: peer,
            limit: Math.min(limit, total - current),
            offset,
            maxId,
        })

        if (!res.photos.length) break

        offset += res.photos.length

        for (const it of res.photos) {
            yield new Photo(this, it as tl.RawPhoto)
        }

        current += res.photos.length

        if (current >= total) break
    }
}
