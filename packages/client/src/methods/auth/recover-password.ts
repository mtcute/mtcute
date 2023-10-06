import { TelegramClient } from '../../client'
import { User } from '../../types'

/**
 * Recover your password with a recovery code and log in.
 *
 * @returns  The authorized user
 * @throws BadRequestError  In case the code is invalid
 * @internal
 */
export async function recoverPassword(
    this: TelegramClient,
    params: {
        /** The recovery code sent via email */
        recoveryCode: string
    },
): Promise<User> {
    const { recoveryCode } = params

    const res = await this.call({
        _: 'auth.recoverPassword',
        code: recoveryCode,
    })

    return this._onAuthorization(res)
}
