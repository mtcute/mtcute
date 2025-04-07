import type { tl } from '@mtcute/tl'

import type { ITelegramClient } from '../../client.types.js'
import { MtArgumentError } from '../../../types/errors.js'
import { SentCode } from '../../types/auth/sent-code.js'
import { User } from '../../types/index.js'
import { normalizePhoneNumber } from '../../utils/misc-utils.js'

/**
 * Send the confirmation code to the given phone number
 *
 * @returns  An object containing information about the sent confirmation code,
 *     or a user if the user was already logged in
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
): Promise<SentCode | User> {
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

    if (res._ === 'auth.sentCodeSuccess') {
        return new User(await client.notifyLoggedIn(res.authorization))
    }

    if (res._ === 'auth.sentCodePaymentRequired') {
        // explicitly not supported, if you need this please implement the logic yourself
        throw new MtArgumentError('Payment is required to sign in, please log in with a first-party client first')
    }

    return new SentCode(res)
}
