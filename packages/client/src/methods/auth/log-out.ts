import { BaseTelegramClient } from '@mtcute/core'

import { getAuthState } from './_state.js'

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

    const authState = getAuthState(client)
    authState.userId = null
    authState.isBot = false
    authState.selfUsername = null
    authState.selfChanged = true

    client.emit('logged_out')

    await client.storage.reset()
    await client.saveStorage()

    return true
}
