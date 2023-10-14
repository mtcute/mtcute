import { BaseTelegramClient } from '@mtcute/core'

import { User } from '../../types/index.js'
import { _onAuthorization } from './_state.js'

/**
 * Recover your password with a recovery code and log in.
 *
 * @returns  The authorized user
 * @throws BadRequestError  In case the code is invalid
 */
export async function recoverPassword(
    client: BaseTelegramClient,
    params: {
        /** The recovery code sent via email */
        recoveryCode: string
    },
): Promise<User> {
    const { recoveryCode } = params

    const res = await client.call({
        _: 'auth.recoverPassword',
        code: recoveryCode,
    })

    return _onAuthorization(client, res)
}
