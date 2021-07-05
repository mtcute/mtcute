import { TelegramClient } from '../../client'
import { User } from '../../types'
import { assertTypeIs } from '../../utils/type-assertion'

/**
 * Get currently authorized user's full information
 *
 * @internal
 */
export function getMe(this: TelegramClient): Promise<User> {
    return this.call({
        _: 'users.getUsers',
        id: [
            {
                _: 'inputUserSelf',
            },
        ],
    }).then(([user]) => {
        assertTypeIs('getMe (@ users.getUsers)', user, 'user')

        this._selfUsername = user.username ?? null

        return new User(this, user)
    })
}
