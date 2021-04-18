import { TelegramClient } from '../../client'

/**
 * Log out from Telegram account and optionally reset the session storage.
 *
 * When you log out, you can immediately log back in using
 * the same {@link TelegramClient} instance.
 *
 * @param resetSession  Whether to reset the session
 * @returns  On success, `true` is returned
 * @internal
 */
export async function logOut(
    this: TelegramClient,
    resetSession = false
): Promise<true> {
    await this.call({ _: 'auth.logOut' })

    if (resetSession) {
        this._userId = null
        this._isBot = false
        this._pts = this._seq = this._date = undefined as any
        this.storage.reset()
        await this._saveStorage()
    }

    return true
}
