import { MtArgumentError } from '@mtcute/core'
import { assertTypeIs, computeNewPasswordHash, computeSrpParams } from '@mtcute/core/utils'

import { TelegramClient } from '../../client'

/**
 * Change your 2FA password
 *
 * @internal
 */
export async function changeCloudPassword(
    this: TelegramClient,
    params: {
        /** Current password as plaintext */
        currentPassword: string
        /** New password as plaintext */
        newPassword: string
        /** Hint for the new password */
        hint?: string
    },
): Promise<void> {
    const { currentPassword, newPassword, hint } = params

    const pwd = await this.call({ _: 'account.getPassword' })

    if (!pwd.hasPassword) {
        throw new MtArgumentError('Cloud password is not enabled')
    }

    const algo = pwd.newAlgo
    assertTypeIs('account.getPassword', algo, 'passwordKdfAlgoSHA256SHA256PBKDF2HMACSHA512iter100000SHA256ModPow')

    const oldSrp = await computeSrpParams(this._crypto, pwd, currentPassword)
    const newHash = await computeNewPasswordHash(this._crypto, algo, newPassword)

    await this.call({
        _: 'account.updatePasswordSettings',
        password: oldSrp,
        newSettings: {
            _: 'account.passwordInputSettings',
            newAlgo: algo,
            newPasswordHash: newHash,
            hint,
        },
    })
}
