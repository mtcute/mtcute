import { BaseTelegramClient } from '@mtcute/core'

/**
 * Log out from Telegram account and optionally reset the session storage.
 *
 * When you log out, you can immediately log back in using
 * the same {@link TelegramClient} instance.
 *
 * @returns  On success, `true` is returned
 */
export async function logOut(client: BaseTelegramClient): Promise<true> {
    await client.call({ _: 'auth.logOut' })

    await client.storage.self.store(null)
    // authState.selfUsername = null todo

    client.emit('logged_out')

    await client.storage.clear()

    return true
}
