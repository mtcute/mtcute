import { BaseTelegramClient } from '@mtcute/core'
import { computeSrpParams } from '@mtcute/core/utils.js'

import { User } from '../../types/index.js'
import { _onAuthorization } from './_state.js'

/**
 * Check your Two-Step verification password and log in
 *
 * @param password  Your Two-Step verification password
 * @returns  The authorized user
 * @throws BadRequestError  In case the password is invalid
 */
export async function checkPassword(client: BaseTelegramClient, password: string): Promise<User> {
    const res = await client.call({
        _: 'auth.checkPassword',
        password: await computeSrpParams(
            client.crypto,
            await client.call({
                _: 'account.getPassword',
            }),
            password,
        ),
    })

    return _onAuthorization(client, res)
}
