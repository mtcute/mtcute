import { assertTrue } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike } from '../../types/index.js'
import { toInputUser } from '../../utils/index.js'
import { resolvePeerMany } from './resolve-peer-many.js'

/**
 * Edit "close friends" list directly using user IDs
 *
 * @param ids  User IDs
 */
export async function editCloseFriendsRaw(client: ITelegramClient, ids: number[]): Promise<void> {
    const r = await client.call({
        _: 'contacts.editCloseFriends',
        id: ids,
    })

    assertTrue('contacts.editCloseFriends', r)
}

/**
 * Edit "close friends" list using `InputPeerLike`s
 *
 * @param ids  User IDs
 */
export async function editCloseFriends(client: ITelegramClient, ids: InputPeerLike[]): Promise<void> {
    const r = await client.call({
        _: 'contacts.editCloseFriends',
        id: await resolvePeerMany(client, ids, toInputUser).then((r) =>
            r.map((u) => {
                if ('userId' in u) return u.userId

                return 0
            }),
        ),
    })

    assertTrue('contacts.editCloseFriends', r)
}
