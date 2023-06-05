import { TelegramClient } from '../../client'
import { User } from '../../types'

/**
 * Change username of the current user.
 *
 * Note that bots usernames must be changed through
 * bot support or re-created from scratch.
 *
 * @param username  New username (5-32 chars, allowed chars: `a-zA-Z0-9_`), or `null` to remove
 * @internal
 */
export async function updateUsername(
    this: TelegramClient,
    username: string | null,
): Promise<User> {
    if (username === null) username = ''

    const res = await this.call({
        _: 'account.updateUsername',
        username,
    })

    this._selfUsername = username || null

    return new User(this, res)
}
