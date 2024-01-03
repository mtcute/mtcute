import { BaseTelegramClient } from '@mtcute/core'
import { assertTypeIs } from '@mtcute/core/utils.js'

import { User } from '../../types/index.js'

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

            await client.storage.self.store({
                userId: user.id,
                isBot: user.bot!,
            })

            // todo
            // authState.selfUsername = user.username ?? null

            return new User(user)
        })
}
