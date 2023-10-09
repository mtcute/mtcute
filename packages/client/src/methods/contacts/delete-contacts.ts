import { BaseTelegramClient, MaybeArray } from '@mtcute/core'

import { InputPeerLike, MtInvalidPeerTypeError, User } from '../../types'
import { normalizeToInputUser } from '../../utils/peer-utils'
import { assertIsUpdatesGroup } from '../../utils/updates-utils'
import { resolvePeerMany } from '../users/resolve-peer-many'

/**
 * Delete a single contact from your Telegram contacts list
 *
 * Returns deleted contact's profile or `null` in case
 * that user was not in your contacts list
 *
 * @param userId  User ID, username or phone number
 */
export async function deleteContacts(client: BaseTelegramClient, userId: InputPeerLike): Promise<User | null>

/**
 * Delete one or more contacts from your Telegram contacts list
 *
 * Returns deleted contact's profiles. Does not return
 * profiles of users that were not in your contacts list
 *
 * @param userIds  User IDs, usernames or phone numbers
 */
export async function deleteContacts(client: BaseTelegramClient, userIds: InputPeerLike[]): Promise<User[]>

/** @internal */
export async function deleteContacts(
    client: BaseTelegramClient,
    userIds: MaybeArray<InputPeerLike>,
): Promise<MaybeArray<User> | null> {
    const single = !Array.isArray(userIds)
    if (single) userIds = [userIds as InputPeerLike]

    const inputPeers = await resolvePeerMany(client, userIds as InputPeerLike[], normalizeToInputUser)

    if (single && !inputPeers.length) {
        throw new MtInvalidPeerTypeError((userIds as InputPeerLike[])[0], 'user')
    }

    const res = await client.call({
        _: 'contacts.deleteContacts',
        id: inputPeers,
    })

    assertIsUpdatesGroup('contacts.deleteContacts', res)

    if (single && !res.updates.length) return null

    client.network.handleUpdate(res)

    const users = res.users.map((user) => new User(user))

    return single ? users[0] : users
}
