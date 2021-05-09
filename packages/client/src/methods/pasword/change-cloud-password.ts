import { TelegramClient } from '../../client'
import { MtCuteArgumentError } from '../../types'
import { assertTypeIs } from '../../utils/type-assertion'
import { computeSrpParams, computeNewPasswordHash } from '@mtcute/core'

/**
 * Change your 2FA password
 *
 * @param currentPassword  Current password as plaintext
 * @param newPassword  New password as plaintext
 * @param hint  Hint for the new password
 * @internal
 */
export async function changeCloudPassword(
    this: TelegramClient,
    currentPassword: string,
    newPassword: string,
    hint?: string
): Promise<void> {
    const pwd = await this.call({ _: 'account.getPassword' })
    if (!pwd.hasPassword)
        throw new MtCuteArgumentError('Cloud password is not enabled')

    const algo = pwd.newAlgo
    assertTypeIs(
        'account.getPassword',
        algo,
        'passwordKdfAlgoSHA256SHA256PBKDF2HMACSHA512iter100000SHA256ModPow'
    )

    const oldSrp = await computeSrpParams(this._crypto, pwd, currentPassword)
    const newHash = await computeNewPasswordHash(this._crypto, algo, newPassword)

    await this.call({
        _: 'account.updatePasswordSettings',
        password: oldSrp,
        newSettings: {
            _: 'account.passwordInputSettings',
            newAlgo: algo,
            newPasswordHash: newHash,
            hint
        }
    })
}
