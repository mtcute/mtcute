import { ITelegramClient } from '../../client.types.js'

/**
 * Log out from Telegram account and optionally reset the session storage.
 *
 * When you log out, you can immediately log back in using
 * the same {@link TelegramClient} instance.
 *
 * @returns  On success, `true` is returned
 */
export async function logOut(client: ITelegramClient): Promise<true> {
    await client.call({ _: 'auth.logOut' })
    await client.notifyLoggedOut()

    return true
}
