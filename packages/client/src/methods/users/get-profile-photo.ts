import { tl } from '@mtcute/core'
import { assertTypeIs } from '@mtcute/core/utils'

import { TelegramClient } from '../../client'
import { InputPeerLike, Photo } from '../../types'
import { normalizeToInputUser } from '../../utils/peer-utils'

/**
 * Get a single profile picture of a user by its ID
 *
 * @param userId  User ID, username, phone number, `"me"` or `"self"`
 * @param photoId  ID of the photo to fetch
 * @param params
 * @internal
 */
export async function getProfilePhoto(this: TelegramClient, userId: InputPeerLike, photoId: tl.Long): Promise<Photo> {
    const res = await this.call({
        _: 'photos.getUserPhotos',
        userId: normalizeToInputUser(await this.resolvePeer(userId), userId),
        offset: -1,
        limit: 1,
        maxId: photoId,
    })

    const photo = res.photos[0]
    assertTypeIs('getProfilePhotos', photo, 'photo')

    return new Photo(this, photo)
}
