import { TelegramClient } from '../../client'
import { User } from '../../types'
import { assertTypeIs } from '../../utils/type-assertion'
import { tl } from '@mtqt/tl'

/**
 * Get list of contacts from your Telegram contacts list.
 * @internal
 */
export async function getContacts(this: TelegramClient): Promise<User[]> {
    const res = await this.call({
        _: 'contacts.getContacts',
        hash: 0,
    })
    assertTypeIs('getContacts', res, 'contacts.contacts')

    return res.users.map((user) => new User(this, user))
}
