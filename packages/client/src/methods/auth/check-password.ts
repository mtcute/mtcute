import { TelegramClient } from '../../client'
import { User } from '../../types'
import { computeSrpParams } from '@mtcute/core'
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

    await this.storage.setSelf({
        userId: res.user.id,
        isBot: false,
    })

    return new User(this, res.user)
}
