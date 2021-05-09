import { TelegramClient } from '../../client'
import { InputPeerLike, MtCuteInvalidPeerTypeError, Photo } from '../../types'
import { normalizeToInputUser } from '../../utils/peer-utils'
import bigInt from 'big-integer'
import { tl } from '@mtcute/tl'

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
    }
): Promise<Photo[]> {
    if (!params) params = {}

    const peer = normalizeToInputUser(await this.resolvePeer(userId))
    if (!peer) throw new MtCuteInvalidPeerTypeError(userId, 'user')

    const res = await this.call({
        _: 'photos.getUserPhotos',
        userId: peer,
        offset: params.offset ?? 0,
        limit: params.limit ?? 100,
        maxId: bigInt.zero
    })

    return res.photos.map((it) => new Photo(this, it as tl.RawPhoto))
}
