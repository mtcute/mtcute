import { MaybeArray } from '../../../types/utils.js'
import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike, User } from '../../types/index.js'
import { toInputUser } from '../../utils/peer-utils.js'
import { _getUsersBatched } from '../chats/batched-queries.js'
import { resolveUser } from './resolve-peer.js'
import { resolvePeerMany } from './resolve-peer-many.js'

/**
 * Get information about multiple users.
 * You can retrieve up to 200 users at once.
 *
 * Note that order is not guaranteed.
 *
 * @param ids  Users' identifiers. Can be ID, username, phone number, `"me"`, `"self"` or TL object
 */
export async function getUsers(client: ITelegramClient, ids: MaybeArray<InputPeerLike>): Promise<(User | null)[]> {
    if (!Array.isArray(ids)) {
        // avoid unnecessary overhead of Promise.all and resolvePeerMany
        const res = await _getUsersBatched(client, await resolveUser(client, ids))

        return [res ? new User(res) : null]
    }

    const inputPeers = await resolvePeerMany(client, ids, toInputUser)

    // pooling will be done by the helper
    const res = await Promise.all(inputPeers.map((peer) => _getUsersBatched(client, peer)))

    return res.map((it) => (it ? new User(it) : null))
}
