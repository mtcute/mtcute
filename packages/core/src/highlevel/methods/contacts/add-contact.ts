import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike, InputText } from '../../types/index.js'
import { inputTextToTl, User } from '../../types/index.js'
import { assertIsUpdatesGroup } from '../../updates/utils.js'
import { resolveUser } from '../users/resolve-peer.js'

/**
 * Add an existing Telegram user as a contact
 */
export async function addContact(
    client: ITelegramClient,
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
         * with the newly created contact
         *
         * @default false
         */
        sharePhone?: boolean

        /**
         * Note to the contact
         */
        note?: InputText
    },
): Promise<User> {
    const { userId, firstName, lastName = '', phone = '', sharePhone = false, note } = params
    const peer = await resolveUser(client, userId)

    const res = await client.call({
        _: 'contacts.addContact',
        id: peer,
        firstName,
        lastName,
        phone,
        addPhonePrivacyException: sharePhone,
        note: note ? inputTextToTl(note) : undefined,
    })

    assertIsUpdatesGroup('contacts.addContact', res)

    client.handleClientUpdate(res)

    return new User(res.users[0])
}
