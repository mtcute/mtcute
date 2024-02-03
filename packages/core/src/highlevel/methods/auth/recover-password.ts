import { ITelegramClient } from '../../client.types.js'
import { User } from '../../types/index.js'
import { _onAuthorization } from './utils.js'

/**
 * Recover your password with a recovery code and log in.
 *
 * @returns  The authorized user
 * @throws BadRequestError  In case the code is invalid
 */
export async function recoverPassword(
    client: ITelegramClient,
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
