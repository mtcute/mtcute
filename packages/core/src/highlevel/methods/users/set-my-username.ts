import { ITelegramClient } from '../../client.types.js'
import { User } from '../../types/index.js'

/**
 * Change username of the current user.
 *
 * Note that bots usernames must be changed through
 * bot support or re-created from scratch.
 *
 * @param username  New username (5-32 chars, allowed chars: `a-zA-Z0-9_`), or `null` to remove
 */
export async function setMyUsername(client: ITelegramClient, username: string | null): Promise<User> {
    if (username === null) username = ''

    const res = await client.call({
        _: 'account.updateUsername',
        username,
    })

    await client.storage.self.update({ username })

    return new User(res)
}
