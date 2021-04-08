import { TelegramClient } from '../../client'

/**
 * Get your Two-Step Verification password hint.
 *
 * @returns  The password hint as a string, if any
 * @internal
 */
export function getPasswordHint(this: TelegramClient): Promise<string | null> {
    return this.call({
        _: 'account.getPassword',
    }).then((res) => res.hint ?? null)
}
