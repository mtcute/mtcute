import Long from 'long'

import { tl } from '@mtcute/core'
import { assertTypeIs } from '@mtcute/core/utils'

import { TelegramClient } from '../../client'
import { ArrayPaginated, InputPeerLike, Photo } from '../../types'
import { makeArrayPaginated } from '../../utils'
import { normalizeToInputUser } from '../../utils/peer-utils'

/**
 * Get a list of profile pictures of a user
 *
 * @param userId  User ID, username, phone number, `"me"` or `"self"`
 * @param params
 * @internal
 */
export async function getProfilePhotos(
    this: TelegramClient,
    userId: InputPeerLike,
    params?: {
        /**
         * Offset from which to fetch.
         *
         * @default  `0`
         */
        offset?: number

        /**
         * Maximum number of items to fetch (up to 100)
         *
         * @default  `100`
         */
        limit?: number
    },
): Promise<ArrayPaginated<Photo, number>> {
    if (!params) params = {}

    const { offset = 0, limit = 100 } = params

    const res = await this.call({
        _: 'photos.getUserPhotos',
        userId: normalizeToInputUser(await this.resolvePeer(userId), userId),
        offset,
        limit,
        maxId: Long.ZERO,
    })

    return makeArrayPaginated(
        res.photos.map((it) => {
            assertTypeIs('getProfilePhotos', it, 'photo')

            return new Photo(this, it)
        }),
        (res as tl.photos.RawPhotosSlice).count ?? res.photos.length,
        offset + res.photos.length,
    )
}
