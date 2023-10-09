import { BaseTelegramClient, MaybeArray } from '@mtcute/core'

import { InputPeerLike, User } from '../../types'
import { normalizeToInputUser } from '../../utils/peer-utils'
import { resolvePeerMany } from './resolve-peer-many'

/**
 * Get information about multiple users.
 * You can retrieve up to 200 users at once.
 *
 * Note that order is not guaranteed.
 *
 * @param ids  Users' identifiers. Can be ID, username, phone number, `"me"`, `"self"` or TL object
 */
export async function getUsers(client: BaseTelegramClient, ids: MaybeArray<InputPeerLike>): Promise<User[]> {
    const isArray = Array.isArray(ids)
    if (!isArray) ids = [ids as InputPeerLike]

    const inputPeers = await resolvePeerMany(client, ids as InputPeerLike[], normalizeToInputUser)

    const res = await client.call({
        _: 'users.getUsers',
        id: inputPeers,
    })

    return res.filter((it) => it._ !== 'userEmpty').map((it) => new User(it))
}
