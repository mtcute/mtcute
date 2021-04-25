import { TelegramClient } from '../../client'
import { InputPeerLike, MtCuteInvalidPeerTypeError, MtCuteTypeAssertionError, User } from '../../types'
import { normalizeToInputUser } from '../../utils/peer-utils'
import { tl } from '@mtcute/tl'

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
    if (!peer) throw new MtCuteInvalidPeerTypeError(userId, 'user')

    const res = await this.call({
        _: 'contacts.addContact',
        id: peer,
        firstName: params.firstName,
        lastName: params.lastName ?? '',
        phone: params.phone ?? '',
        addPhonePrivacyException: !!params.sharePhone
    })

    if (!(res._ === 'updates' || res._ === 'updatesCombined'))
        throw new MtCuteTypeAssertionError(
            'addContact',
            'updates | updatesCombined',
            res._
        )

    this._handleUpdate(res)

    return new User(this, res.users[0] as tl.RawUser)
}
