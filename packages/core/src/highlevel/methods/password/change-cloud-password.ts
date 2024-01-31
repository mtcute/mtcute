import { MtArgumentError } from '../../../types/errors.js'
import { ITelegramClient } from '../../client.types.js'

/**
 * Change your 2FA password
 */
export async function changeCloudPassword(
    client: ITelegramClient,
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

    const oldSrp = await client.computeSrpParams(pwd, currentPassword)
    const newHash = await client.computeNewPasswordHash(algo, newPassword)

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
