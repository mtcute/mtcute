import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/index.js'
import { MtPeerNotFoundError, User } from '../../types/index.js'

import { resolveUser } from '../users/resolve-peer.js'
import { _getUsersBatched } from './batched-queries.js'

// @available=both
/**
 * Get basic information about a user.
 *
 * @param userId  ID of the user or their username or invite link
 */
export async function getUser(client: ITelegramClient, userId: InputPeerLike): Promise<User> {
    const peer = await resolveUser(client, userId)

    const res = await _getUsersBatched(client, peer)

    if (!res) throw new MtPeerNotFoundError(`User ${JSON.stringify(userId)} was not found`)

    return new User(res)
}
