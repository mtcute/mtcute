import Long from 'long'

import { tl } from '@mtcute/tl'

import { TelegramClient } from '../../client'
import { InputPeerLike, Photo } from '../../types'
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
         * Defaults to `0`
         */
        offset?: number

        /**
         * Maximum number of items to fetch (up to 100)
         *
         * Defaults to `100`
         */
        limit?: number
    },
): Promise<Photo[]> {
    if (!params) params = {}

    const res = await this.call({
        _: 'photos.getUserPhotos',
        userId: normalizeToInputUser(await this.resolvePeer(userId), userId),
        offset: params.offset ?? 0,
        limit: params.limit ?? 100,
        maxId: Long.ZERO,
    })

    return res.photos.map((it) => new Photo(this, it as tl.RawPhoto))
}
