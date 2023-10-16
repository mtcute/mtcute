import { BaseTelegramClient, Long } from '@mtcute/core'
import { assertTypeIs } from '@mtcute/core/utils.js'

import { User } from '../../types/index.js'

/**
 * Get list of contacts from your Telegram contacts list.
 */
export async function getContacts(client: BaseTelegramClient): Promise<User[]> {
    const res = await client.call({
        _: 'contacts.getContacts',
        hash: Long.ZERO,
    })
    assertTypeIs('getContacts', res, 'contacts.contacts')

    return res.users.map((user) => new User(user))
}
