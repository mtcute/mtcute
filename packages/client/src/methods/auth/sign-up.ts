import { TelegramClient } from '../../client'
import { normalizePhoneNumber } from '../../utils/misc-utils'
import { assertTypeIs } from '../../utils/type-assertion'
import { User } from '../../types'

/**
 * Register a new user in Telegram.
 *
 * @param phone  Phone number in international format
 * @param phoneCodeHash  Code identifier from {@link TelegramClient.sendCode}
 * @param firstName  New user's first name
 * @param lastName  New user's last name
 * @internal
 */
export async function signUp(
    this: TelegramClient,
    phone: string,
    phoneCodeHash: string,
    firstName: string,
    lastName = ''
): Promise<User> {
    phone = normalizePhoneNumber(phone)

    const res = await this.call({
        _: 'auth.signUp',
        phoneNumber: phone,
        phoneCodeHash,
        firstName,
        lastName,
    })

    assertTypeIs('signUp (@ auth.signUp)', res, 'auth.authorization')
    assertTypeIs('signUp (@ auth.signUp -> user)', res.user, 'user')

    this.log.prefix = `[USER ${this._userId}] `
    this._userId = res.user.id
    this._isBot = false
    this._selfChanged = true
    await this._fetchUpdatesState()
    await this._saveStorage()

    // telegram ignores invokeWithoutUpdates for auth methods
    if (this._disableUpdates) this.primaryConnection._resetSession()
    else this.startUpdatesLoop()

    return new User(this, res.user)
}
