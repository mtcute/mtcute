import { TelegramClient } from '../../client'
import { User } from '../../types'
import { assertTypeIs } from '../../utils/type-assertion'

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
