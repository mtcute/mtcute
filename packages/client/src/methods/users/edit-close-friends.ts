import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'
import { normalizeToInputUser } from '../../utils'

/**
 * Edit "close friends" list directly using user IDs
 *
 * @param ids  User IDs
 * @internal
 */
export async function editCloseFriendsRaw(this: TelegramClient, ids: number[]): Promise<void> {
    await this.call({
        _: 'contacts.editCloseFriends',
        id: ids,
    })
}

/**
 * Edit "close friends" list using `InputPeerLike`s
 *
 * @param ids  User IDs
 * @internal
 */
export async function editCloseFriends(this: TelegramClient, ids: InputPeerLike[]): Promise<void> {
    await this.call({
        _: 'contacts.editCloseFriends',
        id: await this.resolvePeerMany(ids, normalizeToInputUser).then((r) =>
            r.map((u) => {
                if ('userId' in u) return u.userId

                return 0
            }),
        ),
    })
}
