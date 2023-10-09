import { BaseTelegramClient } from '@mtcute/core'

import { User } from '../../types'
import { normalizePhoneNumber } from '../../utils/misc-utils'
import { _onAuthorization } from './_state'

/**
 * Authorize a user in Telegram with a valid confirmation code.
 *
 * @returns  If the code was valid and authorization succeeded, the {@link User} is returned.
 * @throws  BadRequestError  In case the arguments are invalid
 * @throws  SessionPasswordNeededError  In case a password is needed to sign in
 */
export async function signIn(
    client: BaseTelegramClient,
    params: {
        /** Phone number in international format */
        phone: string
        /** Code identifier from {@link sendCode} */
        phoneCodeHash: string
        /** The confirmation code that was received */
        phoneCode: string
    },
): Promise<User> {
    const { phone, phoneCodeHash, phoneCode } = params

    const res = await client.call({
        _: 'auth.signIn',
        phoneNumber: normalizePhoneNumber(phone),
        phoneCodeHash,
        phoneCode,
    })

    return _onAuthorization(client, res)
}
