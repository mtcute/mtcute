import { BaseTelegramClient } from '@mtcute/core'

/**
 * Send a code to email needed to recover your password
 *
 * @returns  String containing email pattern to which the recovery code was sent
 */
export function sendRecoveryCode(client: BaseTelegramClient): Promise<string> {
    return client
        .call({
            _: 'auth.requestPasswordRecovery',
        })
        .then((res) => res.emailPattern)
}
