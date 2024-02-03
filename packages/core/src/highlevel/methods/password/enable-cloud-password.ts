import { MtArgumentError } from '../../../types/errors.js'
import { assertTypeIs } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'

/**
 * Enable 2FA password on your account
 *
 * Note that if you pass `email`, `EmailUnconfirmedError` may be
 * thrown, and you should use {@link verifyPasswordEmail},
 * {@link resendPasswordEmail} or {@link cancelPasswordEmail},
 * and the call this method again
 */
export async function enableCloudPassword(
    client: ITelegramClient,
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

    const pwd = await client.call({ _: 'account.getPassword' })

    if (pwd.hasPassword) {
        throw new MtArgumentError('Cloud password is already enabled')
    }

    const algo = pwd.newAlgo
    assertTypeIs('account.getPassword', algo, 'passwordKdfAlgoSHA256SHA256PBKDF2HMACSHA512iter100000SHA256ModPow')

    const newHash = await client.computeNewPasswordHash(algo, password)

    await client.call({
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
