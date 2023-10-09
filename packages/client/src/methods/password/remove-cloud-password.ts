import { BaseTelegramClient, MtArgumentError } from '@mtcute/core'
import { computeSrpParams } from '@mtcute/core/utils'

/**
 * Remove 2FA password from your account
 *
 * @param password  2FA password as plaintext
 */
export async function removeCloudPassword(client: BaseTelegramClient, password: string): Promise<void> {
    const pwd = await client.call({ _: 'account.getPassword' })

    if (!pwd.hasPassword) {
        throw new MtArgumentError('Cloud password is not enabled')
    }

    const oldSrp = await computeSrpParams(client.crypto, pwd, password)

    await client.call({
        _: 'account.updatePasswordSettings',
        password: oldSrp,
        newSettings: {
            _: 'account.passwordInputSettings',
            newAlgo: { _: 'passwordKdfAlgoUnknown' },
            newPasswordHash: Buffer.alloc(0),
            hint: '',
        },
    })
}
