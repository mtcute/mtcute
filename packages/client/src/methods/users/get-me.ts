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
        _: 'users.getFullUser',
        id: {
            _: 'inputUserSelf',
        },
    }).then((res) => {
        assertTypeIs('getMe (@ users.getFullUser -> user)', res.user, 'user')

        return new User(this, res.user)
    })
}
