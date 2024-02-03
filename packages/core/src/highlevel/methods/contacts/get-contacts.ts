import Long from 'long'

import { assertTypeIs } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'
import { User } from '../../types/index.js'

/**
 * Get list of contacts from your Telegram contacts list.
 */
export async function getContacts(client: ITelegramClient): Promise<User[]> {
    const res = await client.call({
        _: 'contacts.getContacts',
        hash: Long.ZERO,
    })
    assertTypeIs('getContacts', res, 'contacts.contacts')

    return res.users.map((user) => new User(user))
}
