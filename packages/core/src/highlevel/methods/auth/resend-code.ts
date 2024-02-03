import { assertTypeIs } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'
import { SentCode } from '../../types/auth/sent-code.js'
import { normalizePhoneNumber } from '../../utils/misc-utils.js'

/**
 * Re-send the confirmation code using a different type.
 *
 * The type of the code to be re-sent is specified in the `nextType` attribute of
 * {@link SentCode} object returned by {@link sendCode}
 */
export async function resendCode(
    client: ITelegramClient,
    params: {
        /** Phone number in international format */
        phone: string

        /** Confirmation code identifier from {@link SentCode} */
        phoneCodeHash: string
    },
): Promise<SentCode> {
    const { phone, phoneCodeHash } = params

    const res = await client.call({
        _: 'auth.resendCode',
        phoneNumber: normalizePhoneNumber(phone),
        phoneCodeHash,
    })

    assertTypeIs('sendCode', res, 'auth.sentCode')

    return new SentCode(res)
}
