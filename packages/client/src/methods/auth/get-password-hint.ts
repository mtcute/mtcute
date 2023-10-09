import { BaseTelegramClient } from '@mtcute/core'

/**
 * Get your Two-Step Verification password hint.
 *
 * @returns  The password hint as a string, if any
 */
export function getPasswordHint(client: BaseTelegramClient): Promise<string | null> {
    return client
        .call({
            _: 'account.getPassword',
        })
        .then((res) => res.hint ?? null)
}
