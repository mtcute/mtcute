import { assertTypeIs } from '@mtcute/core/utils'

import { TelegramClient } from '../../client'
import { SentCode } from '../../types'
import { normalizePhoneNumber } from '../../utils/misc-utils'

/**
 * Re-send the confirmation code using a different type.
 *
 * The type of the code to be re-sent is specified in the `nextType` attribute of
 * {@link SentCode} object returned by {@link sendCode}
 *
 * @internal
 */
export async function resendCode(
    this: TelegramClient,
    params: {
        /** Phone number in international format */
        phone: string

        /** Confirmation code identifier from {@link SentCode} */
        phoneCodeHash: string
    },
): Promise<SentCode> {
    const { phone, phoneCodeHash } = params

    const res = await this.call({
        _: 'auth.resendCode',
        phoneNumber: normalizePhoneNumber(phone),
        phoneCodeHash,
    })

    assertTypeIs('sendCode', res, 'auth.sentCode')

    return new SentCode(res)
}
