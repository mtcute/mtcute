import { computeSrpParams } from '@mtcute/core'

import { TelegramClient } from '../../client'
import { User } from '../../types'
import { assertTypeIs } from '../../utils/type-assertion'

/**
 * Check your Two-Step verification password and log in
 *
 * @param password  Your Two-Step verification password
 * @returns  The authorized user
 * @throws BadRequestError  In case the password is invalid
 * @internal
 */
export async function checkPassword(
    this: TelegramClient,
    password: string
): Promise<User> {
    const res = await this.call({
        _: 'auth.checkPassword',
        password: await computeSrpParams(
            this._crypto,
            await this.call({
                _: 'account.getPassword',
            }),
            password
        ),
    })

    assertTypeIs(
        'checkPassword (@ auth.checkPassword)',
        res,
        'auth.authorization'
    )
    assertTypeIs(
        'checkPassword (@ auth.checkPassword -> user)',
        res.user,
        'user'
    )

    this.log.prefix = `[USER ${this._userId}] `
    this._userId = res.user.id
    this._isBot = false
    this._selfChanged = true
    this._selfUsername = res.user.username ?? null
    await this._fetchUpdatesState()
    await this._saveStorage()

    // telegram ignores invokeWithoutUpdates for auth methods
    if (this._disableUpdates) this.primaryConnection._resetSession()
    else this.startUpdatesLoop()

    return new User(this, res.user)
}
