import { assertTypeIs } from '@mtcute/core/utils'

import { TelegramClient } from '../../client'
import { SentCode } from '../../types'
import { normalizePhoneNumber } from '../../utils/misc-utils'

/**
 * Send the confirmation code to the given phone number
 *
 * @returns  An object containing information about the sent confirmation code
 * @internal
 */
export async function sendCode(
    this: TelegramClient,
    params: {
        /** Phone number in international format */
        phone: string
    },
): Promise<SentCode> {
    const phone = normalizePhoneNumber(params.phone)

    const res = await this.call({
        _: 'auth.sendCode',
        phoneNumber: phone,
        apiId: this.network._initConnectionParams.apiId,
        apiHash: this._apiHash,
        settings: { _: 'codeSettings' },
    })

    assertTypeIs('sendCode', res, 'auth.sentCode')

    return new SentCode(res)
}
