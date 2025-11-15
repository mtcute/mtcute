import type { tl } from '@mtcute/tl'

import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/index.js'
import { assertTypeIs } from '../../../utils/type-assertions.js'
import { Photo } from '../../types/index.js'

import { resolveUser } from './resolve-peer.js'

/**
 * Get a single profile picture of a user by its ID
 *
 * @param userId  User ID, username, phone number, `"me"` or `"self"`
 * @param photoId  ID of the photo to fetch
 * @param params
 */
export async function getProfilePhoto(
  client: ITelegramClient,
  userId: InputPeerLike,
  photoId: tl.Long,
): Promise<Photo> {
  const res = await client.call({
    _: 'photos.getUserPhotos',
    userId: await resolveUser(client, userId),
    offset: -1,
    limit: 1,
    maxId: photoId,
  })

  const photo = res.photos[0]
  assertTypeIs('getProfilePhotos', photo, 'photo')

  return new Photo(photo)
}
