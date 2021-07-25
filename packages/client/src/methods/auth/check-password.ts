import { TelegramClient } from '../../client'
import { User } from '../../types'
import { computeSrpParams } from '@mtqt/core'
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

    this._userId = res.user.id
    this._isBot = false
    this._selfChanged = true
    await this._fetchUpdatesState()
    await this._saveStorage()

    return new User(this, res.user)
}
