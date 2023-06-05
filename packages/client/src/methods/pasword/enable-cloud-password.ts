import { computeNewPasswordHash } from '@mtcute/core'

import { TelegramClient } from '../../client'
import { MtArgumentError } from '../../types'
import { assertTypeIs } from '../../utils/type-assertion'

/**
 * Enable 2FA password on your account
 *
 * Note that if you pass `email`, `EmailUnconfirmedError` may be
 * thrown, and you should use {@link verifyPasswordEmail},
 * {@link resendPasswordEmail} or {@link cancelPasswordEmail},
 * and the call this method again
 *
 * @param password  2FA password as plaintext
 * @param hint  Hint for the new password
 * @param email  Recovery email
 * @internal
 */
export async function enableCloudPassword(
    this: TelegramClient,
    password: string,
    hint?: string,
    email?: string,
): Promise<void> {
    const pwd = await this.call({ _: 'account.getPassword' })

    if (pwd.hasPassword) { throw new MtArgumentError('Cloud password is already enabled') }

    const algo = pwd.newAlgo
    assertTypeIs(
        'account.getPassword',
        algo,
        'passwordKdfAlgoSHA256SHA256PBKDF2HMACSHA512iter100000SHA256ModPow',
    )

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
