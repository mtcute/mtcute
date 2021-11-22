import { TelegramClient } from '../../client'

/**
 * Get currently authorized user's username.
 *
 * This method uses locally available information and
 * does not call any API methods.
 *
 * @internal
 */
export function getMyUsername(this: TelegramClient): string | null {
    return this._selfUsername
}
