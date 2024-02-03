import { ITelegramClient } from '../../client.types.js'

/**
 * Send a code to email needed to recover your password
 *
 * @returns  String containing email pattern to which the recovery code was sent
 */
export function sendRecoveryCode(client: ITelegramClient): Promise<string> {
    return client
        .call({
            _: 'auth.requestPasswordRecovery',
        })
        .then((res) => res.emailPattern)
}
