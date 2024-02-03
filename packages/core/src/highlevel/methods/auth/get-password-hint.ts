import { ITelegramClient } from '../../client.types.js'

/**
 * Get your Two-Step Verification password hint.
 *
 * @returns  The password hint as a string, if any
 */
export function getPasswordHint(client: ITelegramClient): Promise<string | null> {
    return client
        .call({
            _: 'account.getPassword',
        })
        .then((res) => res.hint ?? null)
}
