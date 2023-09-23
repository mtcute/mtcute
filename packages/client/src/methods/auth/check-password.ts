import { assertTypeIs, computeSrpParams } from '@mtcute/core/utils'

import { TelegramClient } from '../../client'
import { User } from '../../types'

/**
 * Check your Two-Step verification password and log in
 *
 * @param password  Your Two-Step verification password
 * @returns  The authorized user
 * @throws BadRequestError  In case the password is invalid
 * @internal
 */
export async function checkPassword(this: TelegramClient, password: string): Promise<User> {
    const res = await this.call({
        _: 'auth.checkPassword',
        password: await computeSrpParams(
            this._crypto,
            await this.call({
                _: 'account.getPassword',
            }),
            password,
        ),
    })

    assertTypeIs('checkPassword (@ auth.checkPassword)', res, 'auth.authorization')
    assertTypeIs('checkPassword (@ auth.checkPassword -> user)', res.user, 'user')

    this._userId = res.user.id
    this.log.prefix = `[USER ${this._userId}] `
    this._isBot = false
    this._selfChanged = true
    this._selfUsername = res.user.username ?? null
    await this.network.notifyLoggedIn(res)

    await this._fetchUpdatesState()
    await this._saveStorage()

    // telegram ignores invokeWithoutUpdates for auth methods
    if (this.network.params.disableUpdates) this.network.resetSessions()
    else this.startUpdatesLoop()

    return new User(this, res.user)
}
