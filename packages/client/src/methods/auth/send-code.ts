import { BaseTelegramClient } from '@mtcute/core'
import { assertTypeIs } from '@mtcute/core/utils.js'

import { SentCode } from '../../types/index.js'
import { normalizePhoneNumber } from '../../utils/misc-utils.js'

/**
 * Send the confirmation code to the given phone number
 *
 * @returns  An object containing information about the sent confirmation code
 */
export async function sendCode(
    client: BaseTelegramClient,
    params: {
        /** Phone number in international format */
        phone: string
    },
): Promise<SentCode> {
    const phone = normalizePhoneNumber(params.phone)

    const res = await client.call({
        _: 'auth.sendCode',
        phoneNumber: phone,
        apiId: client.network._initConnectionParams.apiId,
        // eslint-disable-next-line dot-notation
        apiHash: client['_apiHash'],
        settings: { _: 'codeSettings' },
    })

    assertTypeIs('sendCode', res, 'auth.sentCode')

    return new SentCode(res)
}
