import { TelegramClient } from '../../client'

/**
 * Log out from Telegram account and optionally reset the session storage.
 *
 * When you log out, you can immediately log back in using
 * the same {@link TelegramClient} instance.
 *
 * @returns  On success, `true` is returned
 * @internal
 */
export async function logOut(this: TelegramClient): Promise<true> {
    await this.call({ _: 'auth.logOut' })

    this._userId = null
    this._isBot = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this._pts = this._seq = this._date = undefined as any
    this._selfUsername = null
    this._selfChanged = true
    this.storage.reset()
    await this._saveStorage()

    return true
}
