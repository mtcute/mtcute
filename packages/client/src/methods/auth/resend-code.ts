import { TelegramClient } from '../../client'
import { SentCode } from '../../types'
import { normalizePhoneNumber } from '../../utils/misc-utils'
import { assertTypeIs } from '../../utils/type-assertion'

/**
 * Re-send the confirmation code using a different type.
 *
 * The type of the code to be re-sent is specified in the `nextType` attribute of
 * {@link SentCode} object returned by {@link sendCode}
 *
 * @param phone  Phone number in international format
 * @param phoneCodeHash  Confirmation code identifier from {@link SentCode}
 * @internal
 */
export async function resendCode(
    this: TelegramClient,
    phone: string,
    phoneCodeHash: string,
): Promise<SentCode> {
    phone = normalizePhoneNumber(phone)

    const res = await this.call({
        _: 'auth.resendCode',
        phoneNumber: phone,
        phoneCodeHash,
    })

    assertTypeIs('sendCode', res, 'auth.sentCode')

    return new SentCode(res)
}
