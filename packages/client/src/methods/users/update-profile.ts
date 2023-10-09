import { BaseTelegramClient } from '@mtcute/core'

import { User } from '../../types'

/**
 * Update your profile details.
 *
 * Only pass fields that you want to change.
 *
 * @param params
 */
export async function updateProfile(
    client: BaseTelegramClient,
    params: {
        /**
         * New first name
         */
        firstName?: string

        /**
         * New last name. Pass `''` (empty string) to remove it
         */
        lastName?: string

        /**
         * New bio (max 70 chars). Pass `''` (empty string) to remove it
         */
        bio?: string
    },
): Promise<User> {
    const res = await client.call({
        _: 'account.updateProfile',
        firstName: params.firstName,
        lastName: params.lastName,
        about: params.bio,
    })

    return new User(res)
}
