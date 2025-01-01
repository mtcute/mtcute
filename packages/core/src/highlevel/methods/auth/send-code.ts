import type { tl } from '@mtcute/tl'

import type { ITelegramClient } from '../../client.types.js'
import { assertTypeIs } from '../../../utils/type-assertions.js'
import { SentCode } from '../../types/auth/sent-code.js'
import { normalizePhoneNumber } from '../../utils/misc-utils.js'

/**
 * Send the confirmation code to the given phone number
 *
 * @returns  An object containing information about the sent confirmation code
 */
export async function sendCode(
    client: ITelegramClient,
    params: {
        /** Phone number in international format */
        phone: string

        /** Saved future auth tokens, if any */
        futureAuthTokens?: Uint8Array[]

        /** Additional code settings to pass to the server */
        codeSettings?: Omit<tl.RawCodeSettings, '_' | 'logoutTokens'>

        /** Abort signal */
        abortSignal?: AbortSignal
    },
): Promise<SentCode> {
    const phone = normalizePhoneNumber(params.phone)

    const { id, hash } = await client.getApiCredentials()

    const res = await client.call(
        {
            _: 'auth.sendCode',
            phoneNumber: phone,
            apiId: id,
            apiHash: hash,
            settings: {
                _: 'codeSettings',
                logoutTokens: params.futureAuthTokens,
                ...params.codeSettings,
            },
        },
        { abortSignal: params.abortSignal },
    )

    assertTypeIs('sendCode', res, 'auth.sentCode')

    return new SentCode(res)
}
