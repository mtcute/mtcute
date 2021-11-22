import { TelegramClient } from '../../client'
import { User } from '../../types'
import { assertTypeIs } from '../../utils/type-assertion'
import Long from 'long'

/**
 * Get list of contacts from your Telegram contacts list.
 * @internal
 */
export async function getContacts(this: TelegramClient): Promise<User[]> {
    const res = await this.call({
        _: 'contacts.getContacts',
        hash: Long.ZERO,
    })
    assertTypeIs('getContacts', res, 'contacts.contacts')

    return res.users.map((user) => new User(this, user))
}
