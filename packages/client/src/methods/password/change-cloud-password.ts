import { BaseTelegramClient, MtArgumentError } from '@mtcute/core'
import { assertTypeIs, computeNewPasswordHash, computeSrpParams } from '@mtcute/core/utils.js'

/**
 * Change your 2FA password
 */
export async function changeCloudPassword(
    client: BaseTelegramClient,
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

    const pwd = await client.call({ _: 'account.getPassword' })

    if (!pwd.hasPassword) {
        throw new MtArgumentError('Cloud password is not enabled')
    }

    const algo = pwd.newAlgo
    assertTypeIs('account.getPassword', algo, 'passwordKdfAlgoSHA256SHA256PBKDF2HMACSHA512iter100000SHA256ModPow')

    const oldSrp = await computeSrpParams(client.crypto, pwd, currentPassword)
    const newHash = await computeNewPasswordHash(client.crypto, algo, newPassword)

    await client.call({
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
