import { BaseTelegramClient } from '@mtcute/core'

import { InputPeerLike } from '../../types/index.js'
import { normalizeToInputUser } from '../../utils/index.js'
import { resolvePeerMany } from './resolve-peer-many.js'

/**
 * Edit "close friends" list directly using user IDs
 *
 * @param ids  User IDs
 */
export async function editCloseFriendsRaw(client: BaseTelegramClient, ids: number[]): Promise<void> {
    await client.call({
        _: 'contacts.editCloseFriends',
        id: ids,
    })
}

/**
 * Edit "close friends" list using `InputPeerLike`s
 *
 * @param ids  User IDs
 */
export async function editCloseFriends(client: BaseTelegramClient, ids: InputPeerLike[]): Promise<void> {
    await client.call({
        _: 'contacts.editCloseFriends',
        id: await resolvePeerMany(client, ids, normalizeToInputUser).then((r) =>
            r.map((u) => {
                if ('userId' in u) return u.userId

                return 0
            }),
        ),
    })
}
