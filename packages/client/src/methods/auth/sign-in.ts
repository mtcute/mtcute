import { TelegramClient } from '../../client'
import { User } from '../../types'
import { normalizePhoneNumber } from '../../utils/misc-utils'

/**
 * Authorize a user in Telegram with a valid confirmation code.
 *
 * @returns  If the code was valid and authorization succeeded, the {@link User} is returned.
 * @throws  BadRequestError  In case the arguments are invalid
 * @throws  SessionPasswordNeededError  In case a password is needed to sign in
 * @internal
 */
export async function signIn(
    this: TelegramClient,
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

    const res = await this.call({
        _: 'auth.signIn',
        phoneNumber: normalizePhoneNumber(phone),
        phoneCodeHash,
        phoneCode,
    })

    return this._onAuthorization(res)
}
