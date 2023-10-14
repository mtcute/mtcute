import { BaseTelegramClient } from '@mtcute/core'
import { assertTypeIs } from '@mtcute/core/utils.js'

import { User } from '../../types/index.js'
import { getAuthState } from '../auth/_state.js'

/**
 * Get currently authorized user's full information
 */
export function getMe(client: BaseTelegramClient): Promise<User> {
    return client
        .call({
            _: 'users.getUsers',
            id: [
                {
                    _: 'inputUserSelf',
                },
            ],
        })
        .then(async ([user]) => {
            assertTypeIs('getMe (@ users.getUsers)', user, 'user')

            const authState = getAuthState(client)

            if (authState.userId !== user.id) {
                // there is such possibility, e.g. when
                // using a string session without `self`,
                // or logging out and re-logging in
                // we need to update the fields accordingly,
                // and force-save the session
                authState.userId = user.id
                authState.isBot = Boolean(user.bot)
                authState.selfChanged = true
                await client.saveStorage()
            }

            authState.selfUsername = user.username ?? null

            return new User(user)
        })
}
