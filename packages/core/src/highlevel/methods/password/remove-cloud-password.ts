import { MtArgumentError } from '../../../types/errors.js'
import { ITelegramClient } from '../../client.types.js'

/**
 * Remove 2FA password from your account
 *
 * @param password  2FA password as plaintext
 */
export async function removeCloudPassword(client: ITelegramClient, password: string): Promise<void> {
    const pwd = await client.call({ _: 'account.getPassword' })

    if (!pwd.hasPassword) {
        throw new MtArgumentError('Cloud password is not enabled')
    }

    const oldSrp = await client.computeSrpParams(pwd, password)

    await client.call({
        _: 'account.updatePasswordSettings',
        password: oldSrp,
        newSettings: {
            _: 'account.passwordInputSettings',
            newAlgo: { _: 'passwordKdfAlgoUnknown' },
            newPasswordHash: new Uint8Array(0),
            hint: '',
        },
    })
}
