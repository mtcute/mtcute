import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/index.js'
import { FullUser } from '../../types/index.js'

import { resolveUser } from '../users/resolve-peer.js'

// @available=both
/**
 * Get full information about a user.
 *
 * @param userId  ID of the user or their username
 */
export async function getFullUser(client: ITelegramClient, userId: InputPeerLike): Promise<FullUser> {
  const peer = await resolveUser(client, userId)

  const res = await client.call({
    _: 'users.getFullUser',
    id: peer,
  })

  return new FullUser(res)
}
