import { ITelegramClient } from '../../client.types.js'

// @exported
export interface LogOutResult {
    /**
     * Future auth token returned by the server (if any), which can then be passed to
     * {@link start} and {@link sendCode} methods to avoid sending the code again.
     */
    futureAuthToken?: Uint8Array
}

/**
 * Log out from Telegram account and optionally reset the session storage.
 *
 * When you log out, you can immediately log back in using
 * the same {@link TelegramClient} instance.
 *
 * @returns  On success, `true` is returned
 */
export async function logOut(client: ITelegramClient): Promise<LogOutResult> {
    const res = await client.call({ _: 'auth.logOut' })
    await client.notifyLoggedOut()

    return {
        futureAuthToken: res.futureAuthToken,
    }
}
