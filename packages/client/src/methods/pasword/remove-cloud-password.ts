import { MtArgumentError } from '@mtcute/core'
import { computeSrpParams } from '@mtcute/core/utils'

import { TelegramClient } from '../../client'

/**
 * Remove 2FA password from your account
 *
 * @param password  2FA password as plaintext
 * @internal
 */
export async function removeCloudPassword(this: TelegramClient, password: string): Promise<void> {
    const pwd = await this.call({ _: 'account.getPassword' })

    if (!pwd.hasPassword) {
        throw new MtArgumentError('Cloud password is not enabled')
    }

    const oldSrp = await computeSrpParams(this._crypto, pwd, password)

    await this.call({
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
