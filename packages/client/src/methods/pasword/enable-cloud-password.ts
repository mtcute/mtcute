import { MtArgumentError } from '@mtcute/core'
import { assertTypeIs, computeNewPasswordHash } from '@mtcute/core/utils'

import { TelegramClient } from '../../client'

/**
 * Enable 2FA password on your account
 *
 * Note that if you pass `email`, `EmailUnconfirmedError` may be
 * thrown, and you should use {@link verifyPasswordEmail},
 * {@link resendPasswordEmail} or {@link cancelPasswordEmail},
 * and the call this method again
 *
 * @internal
 */
export async function enableCloudPassword(
    this: TelegramClient,
    params: {
        /** 2FA password as plaintext */
        password: string
        /** Hint for the new password */
        hint?: string
        /** Recovery email */
        email?: string
    },
): Promise<void> {
    const { password, hint, email } = params

    const pwd = await this.call({ _: 'account.getPassword' })

    if (pwd.hasPassword) {
        throw new MtArgumentError('Cloud password is already enabled')
    }

    const algo = pwd.newAlgo
    assertTypeIs('account.getPassword', algo, 'passwordKdfAlgoSHA256SHA256PBKDF2HMACSHA512iter100000SHA256ModPow')

    const newHash = await computeNewPasswordHash(this._crypto, algo, password)

    await this.call({
        _: 'account.updatePasswordSettings',
        password: { _: 'inputCheckPasswordEmpty' },
        newSettings: {
            _: 'account.passwordInputSettings',
            newAlgo: algo,
            newPasswordHash: newHash,
            hint,
            email,
        },
    })
}
