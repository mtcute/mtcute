import { BaseTelegramClient, MaybeArray } from '@mtcute/core'

import { InputPeerLike, User } from '../../types/index.js'
import { normalizeToInputUser } from '../../utils/peer-utils.js'
import { _getUsersBatched } from '../chats/batched-queries.js'
import { resolvePeer } from './resolve-peer.js'
import { resolvePeerMany } from './resolve-peer-many.js'

/**
 * Get information about multiple users.
 * You can retrieve up to 200 users at once.
 *
 * Note that order is not guaranteed.
 *
 * @param ids  Users' identifiers. Can be ID, username, phone number, `"me"`, `"self"` or TL object
 */
export async function getUsers(client: BaseTelegramClient, ids: MaybeArray<InputPeerLike>): Promise<(User | null)[]> {
    if (!Array.isArray(ids)) {
        // avoid unnecessary overhead of Promise.all and resolvePeerMany
        const res = await _getUsersBatched(client, normalizeToInputUser(await resolvePeer(client, ids)))

        return [res ? new User(res) : null]
    }

    const inputPeers = await resolvePeerMany(client, ids, normalizeToInputUser)

    // pooling will be done by the helper
    const res = await Promise.all(inputPeers.map((peer) => _getUsersBatched(client, peer)))

    return res.map((it) => (it ? new User(it) : null))
}
