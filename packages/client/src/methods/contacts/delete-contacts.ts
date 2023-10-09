import { BaseTelegramClient, MaybeArray } from '@mtcute/core'

import { InputPeerLike, MtInvalidPeerTypeError, User } from '../../types'
import { normalizeToInputUser } from '../../utils/peer-utils'
import { assertIsUpdatesGroup } from '../../utils/updates-utils'
import { resolvePeerMany } from '../users/resolve-peer-many'

/**
 * Delete one or more contacts from your Telegram contacts list
 *
 * Returns deleted contact's profiles. Does not return
 * profiles of users that were not in your contacts list
 *
 * @param userIds  User IDs, usernames or phone numbers
 */
export async function deleteContacts(client: BaseTelegramClient, userIds: MaybeArray<InputPeerLike>): Promise<User[]> {
    if (!Array.isArray(userIds)) userIds = [userIds]

    const inputPeers = await resolvePeerMany(client, userIds, normalizeToInputUser)

    if (!inputPeers.length) {
        throw new MtInvalidPeerTypeError('all provided ids', 'user')
    }

    const res = await client.call({
        _: 'contacts.deleteContacts',
        id: inputPeers,
    })

    assertIsUpdatesGroup('contacts.deleteContacts', res)

    client.network.handleUpdate(res)

    return res.users.map((user) => new User(user))
}
