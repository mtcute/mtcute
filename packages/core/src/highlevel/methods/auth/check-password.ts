import type { tl } from '@mtcute/tl'
import type { ITelegramClient } from '../../client.types.js'
import type { User } from '../../types/index.js'

import { _onAuthorization } from './utils.js'

/**
 * Check your Two-Step verification password and log in
 *
 * @returns  The authorized user
 * @throws BadRequestError  In case the password is invalid
 */
export async function checkPassword(
    client: ITelegramClient,
    options: string | {
        /** Your Two-Step verification password */
        password: string

        /** Existing response from `account.getPassword`, if available (to avoid extra API calls) */
        passwordObj?: tl.account.TypePassword

        /** Abort signal */
        abortSignal?: AbortSignal
    },
): Promise<User> {
    const opts = typeof options === 'string' ? { password: options } : options

    const passwordObj = opts.passwordObj ?? await client.call({
        _: 'account.getPassword',
    }, { abortSignal: opts.abortSignal })
    const res = await client.call({
        _: 'auth.checkPassword',
        password: await client.computeSrpParams(
            passwordObj,
            opts.password,
        ),
    }, { abortSignal: opts.abortSignal })

    return _onAuthorization(client, res)
}
