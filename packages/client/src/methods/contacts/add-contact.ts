import { TelegramClient } from '../../client'
import { InputPeerLike, MtInvalidPeerTypeError, User } from '../../types'
import { normalizeToInputUser } from '../../utils/peer-utils'
import { assertIsUpdatesGroup } from '../../utils/updates-utils'

/**
 * Add an existing Telegram user as a contact
 *
 * @param userId  User ID, username or phone number
 * @param params  Contact details
 * @internal
 */
export async function addContact(
    this: TelegramClient,
    userId: InputPeerLike,
    params: {
        /**
         * First name of the contact
         */
        firstName: string

        /**
         * Last name of the contact
         */
        lastName?: string

        /**
         * Phone number of the contact, if available
         */
        phone?: string

        /**
         * Whether to share your own phone number
         * with the newly created contact (defaults to `false`)
         */
        sharePhone?: boolean
    }
): Promise<User> {
    const peer = normalizeToInputUser(await this.resolvePeer(userId))
    if (!peer) throw new MtInvalidPeerTypeError(userId, 'user')

    const res = await this.call({
        _: 'contacts.addContact',
        id: peer,
        firstName: params.firstName,
        lastName: params.lastName ?? '',
        phone: params.phone ?? '',
        addPhonePrivacyException: !!params.sharePhone,
    })

    assertIsUpdatesGroup('contacts.addContact', res)

    this._handleUpdate(res)

    return new User(this, res.users[0])
}
