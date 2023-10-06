import { computeSrpParams } from '@mtcute/core/utils'

import { TelegramClient } from '../../client'
import { User } from '../../types'

/**
 * Check your Two-Step verification password and log in
 *
 * @param password  Your Two-Step verification password
 * @returns  The authorized user
 * @throws BadRequestError  In case the password is invalid
 * @internal
 */
export async function checkPassword(this: TelegramClient, password: string): Promise<User> {
    const res = await this.call({
        _: 'auth.checkPassword',
        password: await computeSrpParams(
            this._crypto,
            await this.call({
                _: 'account.getPassword',
            }),
            password,
        ),
    })

    return this._onAuthorization(res)
}
