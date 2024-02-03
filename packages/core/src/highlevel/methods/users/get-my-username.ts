import { ITelegramClient } from '../../client.types.js'

/**
 * Get currently authorized user's username.
 *
 * This method uses locally available information and
 * does not call any API methods.
 */
export async function getMyUsername(client: ITelegramClient): Promise<string | null> {
    return client.storage.self.fetch().then((self) => self?.usernames[0] ?? null)
}
