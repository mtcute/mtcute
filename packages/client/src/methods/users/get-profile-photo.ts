import { BaseTelegramClient, tl } from '@mtcute/core'
import { assertTypeIs } from '@mtcute/core/utils.js'

import { InputPeerLike, Photo } from '../../types/index.js'
import { toInputUser } from '../../utils/peer-utils.js'
import { resolvePeer } from './resolve-peer.js'

/**
 * Get a single profile picture of a user by its ID
 *
 * @param userId  User ID, username, phone number, `"me"` or `"self"`
 * @param photoId  ID of the photo to fetch
 * @param params
 */
export async function getProfilePhoto(
    client: BaseTelegramClient,
    userId: InputPeerLike,
    photoId: tl.Long,
): Promise<Photo> {
    const res = await client.call({
        _: 'photos.getUserPhotos',
        userId: toInputUser(await resolvePeer(client, userId), userId),
        offset: -1,
        limit: 1,
        maxId: photoId,
    })

    const photo = res.photos[0]
    assertTypeIs('getProfilePhotos', photo, 'photo')

    return new Photo(photo)
}
