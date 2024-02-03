import { MaybeArray } from '../../../types/utils.js'
import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike, MtInvalidPeerTypeError, User } from '../../types/index.js'
import { assertIsUpdatesGroup } from '../../updates/utils.js'
import { toInputUser } from '../../utils/peer-utils.js'
import { resolvePeerMany } from '../users/resolve-peer-many.js'

/**
 * Delete one or more contacts from your Telegram contacts list
 *
 * Returns deleted contact's profiles. Does not return
 * profiles of users that were not in your contacts list
 *
 * @param userIds  User IDs, usernames or phone numbers
 */
export async function deleteContacts(client: ITelegramClient, userIds: MaybeArray<InputPeerLike>): Promise<User[]> {
    if (!Array.isArray(userIds)) userIds = [userIds]

    const inputPeers = await resolvePeerMany(client, userIds, toInputUser)

    if (!inputPeers.length) {
        throw new MtInvalidPeerTypeError('all provided ids', 'user')
    }

    const res = await client.call({
        _: 'contacts.deleteContacts',
        id: inputPeers,
    })

    assertIsUpdatesGroup('contacts.deleteContacts', res)

    client.handleClientUpdate(res)

    return res.users.map((user) => new User(user))
}
