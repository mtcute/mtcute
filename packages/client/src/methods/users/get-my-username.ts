import { BaseTelegramClient } from '@mtcute/core'

import { getAuthState } from '../auth/_state'

/**
 * Get currently authorized user's username.
 *
 * This method uses locally available information and
 * does not call any API methods.
 */
export function getMyUsername(client: BaseTelegramClient): string | null {
    return getAuthState(client).selfUsername
}
