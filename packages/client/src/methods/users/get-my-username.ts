import { BaseTelegramClient } from '@mtcute/core'

/**
 * Get currently authorized user's username.
 *
 * This method uses locally available information and
 * does not call any API methods.
 */
export function getMyUsername(client: BaseTelegramClient): string | null {
    throw new Error('Not implemented')
    // return getAuthState(client).selfUsername
}
