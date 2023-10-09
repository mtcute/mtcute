import { BaseTelegramClient, MaybeArray } from '@mtcute/core'

import { InputPeerLike, User } from '../../types'
import { normalizeToInputUser } from '../../utils/peer-utils'
import { resolvePeerMany } from './resolve-peer-many'

/**
 * Get information about a single user.
 *
 * @param id  User's identifier. Can be ID, username, phone number, `"me"` or `"self"` or TL object
 */
export async function getUsers(client: BaseTelegramClient, id: InputPeerLike): Promise<User>

/**
 * Get information about multiple users.
 * You can retrieve up to 200 users at once.
 *
 * Note that order is not guaranteed.
 *
 * @param ids  Users' identifiers. Can be ID, username, phone number, `"me"`, `"self"` or TL object
 */
export async function getUsers(client: BaseTelegramClient, ids: InputPeerLike[]): Promise<User[]>

/** @internal */
export async function getUsers(client: BaseTelegramClient, ids: MaybeArray<InputPeerLike>): Promise<MaybeArray<User>> {
    const isArray = Array.isArray(ids)
    if (!isArray) ids = [ids as InputPeerLike]

    const inputPeers = await resolvePeerMany(client, ids as InputPeerLike[], normalizeToInputUser)

    let res = await client.call({
        _: 'users.getUsers',
        id: inputPeers,
    })

    res = res.filter((it) => it._ !== 'userEmpty')

    return isArray ? res.map((it) => new User(it)) : new User(res[0])
}
