import { ITelegramClient } from '../../client.types.js'

/**
 * Get currently authorized user's username.
 *
 * This method uses locally available information and
 * does not call any API methods.
 */
export function getMyUsername(client: ITelegramClient): string | null {
    throw new Error('Not implemented')
    // return getAuthState(client).selfUsername
}
