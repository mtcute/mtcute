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
    }).then(async ([user]) => {
        assertTypeIs('getMe (@ users.getUsers)', user, 'user')

        if (this._userId !== user.id) {
            // there is such possibility, e.g. when
            // using a string session without `self`,
            // or logging out and re-logging in
            // we need to update the fields accordingly,
            // and force-save the session
            this._userId = user.id
            this._isBot = Boolean(user.bot)
            await this._saveStorage()
        }

        this._selfUsername = user.username ?? null

        return new User(this, user)
    })
}
