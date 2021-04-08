import { InputPeerLike, User } from '../../types'
import { TelegramClient } from '../../client'
import { MaybeArray } from '@mtcute/core'
import { tl } from '@mtcute/tl'
import { normalizeToInputUser } from '../../utils/peer-utils'

/**
 * Get information about a single user.
 *
 * @param id  User's identifier. Can be ID, username, phone number, `"me"` or `"self"` or TL object
 * @internal
 */
export async function getUsers(
    this: TelegramClient,
    id: InputPeerLike
): Promise<User>

/**
 * Get information about multiple users.
 * You can retrieve up to 200 users at once
 *
 * @param ids  Users' identifiers. Can be ID, username, phone number, `"me"`, `"self"` or TL object
 * @internal
 */
export async function getUsers(
    this: TelegramClient,
    ids: InputPeerLike[]
): Promise<User[]>

/** @internal */
export async function getUsers(
    this: TelegramClient,
    ids: MaybeArray<InputPeerLike>
): Promise<MaybeArray<User>> {
    const isArray = Array.isArray(ids)
    if (!isArray) ids = [ids as InputPeerLike]

    const inputPeers = ((
        await Promise.all(
            (ids as InputPeerLike[]).map((it) =>
                this.resolvePeer(it).then(normalizeToInputUser)
            )
        )
    ).filter(Boolean) as unknown) as tl.TypeInputUser[]

    let res = await this.call({
        _: 'users.getUsers',
        id: inputPeers,
    })

    res = res.filter((it) => it._ !== 'userEmpty')

    return isArray
        ? res.map((it) => new User(this, it as tl.RawUser))
        : new User(this, res[0] as tl.RawUser)
}
