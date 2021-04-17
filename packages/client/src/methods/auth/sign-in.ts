import { MtCuteError, User, TermsOfService } from '../../types'
import { TelegramClient } from '../../client'
import { assertTypeIs } from '../../utils/type-assertion'
import { normalizePhoneNumber } from '../../utils/misc-utils'

/**
 * Authorize a user in Telegram with a valid confirmation code.
 *
 * @param phone  Phone number in international format
 * @param phoneCodeHash  Code identifier from {@link TelegramClient.sendCode}
 * @param phoneCode  The confirmation code that was received
 * @returns
 *   - If the code was valid and authorization succeeded, the {@link User} is returned.
 *   - If the given phone number needs to be registered AND the ToS must be accepted,
 *     an object containing them is returned.
 *   - If the given phone number needs to be registered, `false` is returned.
 * @throws BadRequestError  In case the arguments are invalid
 * @throws SessionPasswordNeededError  In case a password is needed to sign in
 * @internal
 */
export async function signIn(
    this: TelegramClient,
    phone: string,
    phoneCodeHash: string,
    phoneCode: string
): Promise<User | TermsOfService | false> {
    phone = normalizePhoneNumber(phone)

    const res = await this.call({
        _: 'auth.signIn',
        phoneNumber: phone,
        phoneCodeHash,
        phoneCode,
    })

    if (res._ === 'auth.authorizationSignUpRequired') {
        if (res.termsOfService) return new TermsOfService(res.termsOfService)

        return false
    }

    assertTypeIs('signIn (@ auth.signIn -> user)', res.user, 'user')

    await this.storage.setSelf({
        userId: res.user.id,
        isBot: false,
    })
    await this._saveStorage()

    return new User(this, res.user)
}
