import { TelegramClient } from '../../client'
import { MaybeArray } from '@mtqt/core'
import {
    InputPeerLike,
    MtqtInvalidPeerTypeError,
    MtqtTypeAssertionError,
    User,
} from '../../types'
import { normalizeToInputUser } from '../../utils/peer-utils'
import { tl } from '@mtqt/tl'
import { assertIsUpdatesGroup } from '../../utils/updates-utils'

/**
 * Delete a single contact from your Telegram contacts list
 *
 * Returns deleted contact's profile or `null` in case
 * that user was not in your contacts list
 *
 * @param userId  User ID, username or phone number
 * @internal
 */
export async function deleteContacts(
    this: TelegramClient,
    userId: InputPeerLike
): Promise<User | null>

/**
 * Delete one or more contacts from your Telegram contacts list
 *
 * Returns deleted contact's profiles. Does not return
 * profiles of users that were not in your contacts list
 *
 * @param userIds  User IDs, usernames or phone numbers
 * @internal
 */
export async function deleteContacts(
    this: TelegramClient,
    userIds: InputPeerLike[]
): Promise<User[]>

/** @internal */
export async function deleteContacts(
    this: TelegramClient,
    userIds: MaybeArray<InputPeerLike>
): Promise<MaybeArray<User> | null> {
    const single = !Array.isArray(userIds)
    if (single) userIds = [userIds as InputPeerLike]

    const inputPeers = await this.resolvePeerMany(
        userIds as InputPeerLike[],
        normalizeToInputUser
    )

    if (single && !inputPeers.length)
        throw new MtqtInvalidPeerTypeError(
            (userIds as InputPeerLike[])[0],
            'user'
        )

    const res = await this.call({
        _: 'contacts.deleteContacts',
        id: inputPeers,
    })

    assertIsUpdatesGroup('contacts.deleteContacts', res)

    if (single && !res.updates.length) return null

    this._handleUpdate(res)

    const users = res.users.map((user) => new User(this, user))

    return single ? users[0] : users
}
