import { TelegramClient } from '../../client'

/**
 * Send a code to email needed to recover your password
 *
 * @returns  String containing email pattern to which the recovery code was sent
 * @internal
 */
export function sendRecoveryCode(this: TelegramClient): Promise<string> {
    return this.call({
        _: 'auth.requestPasswordRecovery',
    }).then((res) => res.emailPattern)
}
