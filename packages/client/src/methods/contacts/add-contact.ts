import { TelegramClient } from '../../client'
import { InputPeerLike, User } from '../../types'
import { normalizeToInputUser } from '../../utils/peer-utils'
import { assertIsUpdatesGroup } from '../../utils/updates-utils'

/**
 * Add an existing Telegram user as a contact
 *
 * @internal
 */
export async function addContact(
    this: TelegramClient,
    params: {
        /** User ID, username or phone number */
        userId: InputPeerLike

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
    },
): Promise<User> {
    const { userId, firstName, lastName = '', phone = '', sharePhone = false } = params
    const peer = normalizeToInputUser(await this.resolvePeer(userId), userId)

    const res = await this.call({
        _: 'contacts.addContact',
        id: peer,
        firstName,
        lastName,
        phone,
        addPhonePrivacyException: sharePhone,
    })

    assertIsUpdatesGroup('contacts.addContact', res)

    this._handleUpdate(res)

    return new User(this, res.users[0])
}
