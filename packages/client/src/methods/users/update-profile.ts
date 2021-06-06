import { TelegramClient } from '../../client'
import { User } from '../../types'

/**
 * Update your profile details.
 *
 * Only pass fields that you want to change.
 *
 * @param params
 * @internal
 */
export async function updateProfile(
    this: TelegramClient,
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
    }
): Promise<User> {
    const res = await this.call({
        _: 'account.updateProfile',
        firstName: params.firstName,
        lastName: params.lastName,
        about: params.bio,
    })

    return new User(this, res)
}
