import { BaseTelegramClient } from '@mtcute/core'

import { User } from '../../types/index.js'
import { getAuthState } from '../auth/_state.js'

/**
 * Change username of the current user.
 *
 * Note that bots usernames must be changed through
 * bot support or re-created from scratch.
 *
 * @param username  New username (5-32 chars, allowed chars: `a-zA-Z0-9_`), or `null` to remove
 */
export async function setUsername(client: BaseTelegramClient, username: string | null): Promise<User> {
    if (username === null) username = ''

    const res = await client.call({
        _: 'account.updateUsername',
        username,
    })

    getAuthState(client).selfUsername = username || null

    return new User(res)
}
