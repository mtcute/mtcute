/* eslint-disable @typescript-eslint/no-unused-vars */
import { MtUnsupportedError, tl } from '@mtcute/core'
import { assertTypeIs } from '@mtcute/core/utils'

import { TelegramClient } from '../../client'
import { User } from '../../types'

// @extension
interface AuthState {
    // local copy of "self" in storage,
    // so we can use it w/out relying on storage.
    // they are both loaded and saved to storage along with the updates
    // (see methods/updates)
    _userId: number | null
    _isBot: boolean

    _selfUsername: string | null
}

// @initialize
function _initializeAuthState(this: TelegramClient) {
    this._userId = null
    this._isBot = false
    this._selfUsername = null
    this.log.prefix = '[USER N/A] '
}

/** @internal */
export async function _onAuthorization(
    this: TelegramClient,
    auth: tl.auth.TypeAuthorization,
    bot = false,
): Promise<User> {
    if (auth._ === 'auth.authorizationSignUpRequired') {
        throw new MtUnsupportedError(
            'Signup is no longer supported by Telegram for non-official clients. Please use your mobile device to sign up.',
        )
    }

    assertTypeIs('_onAuthorization (@ auth.authorization -> user)', auth.user, 'user')

    this._userId = auth.user.id
    this.log.prefix = `[USER ${this._userId}] `
    this._isBot = bot
    this._selfUsername = auth.user.username!
    this._selfChanged = true

    await this.network.notifyLoggedIn(auth)

    await this._fetchUpdatesState()
    await this._saveStorage()

    // telegram ignores invokeWithoutUpdates for auth methods
    if (this.network.params.disableUpdates) this.network.resetSessions()
    else this.startUpdatesLoop()

    return new User(this, auth.user)
}
