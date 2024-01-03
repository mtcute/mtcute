/* eslint-disable no-inner-declarations */
import { BaseTelegramClient, MtUnsupportedError, tl } from '@mtcute/core'
import { assertTypeIs } from '@mtcute/core/utils.js'

import { User } from '../../types/peers/user.js'

/** @internal */
export async function _onAuthorization(
    client: BaseTelegramClient,
    auth: tl.auth.TypeAuthorization,
): Promise<User> {
    if (auth._ === 'auth.authorizationSignUpRequired') {
        throw new MtUnsupportedError(
            'Signup is no longer supported by Telegram for non-official clients. Please use your mobile device to sign up.',
        )
    }

    assertTypeIs('_onAuthorization (@ auth.authorization -> user)', auth.user, 'user')

    // todo: selfUsername
    await client.notifyLoggedIn(auth)

    // telegram ignores invokeWithoutUpdates for auth methods
    if (client.network.params.disableUpdates) client.network.resetSessions()

    return new User(auth.user)
}

/**
 * Check if the given peer/input peer is referring to the current user
 */
export function isSelfPeer(
    client: BaseTelegramClient,
    peer: tl.TypeInputPeer | tl.TypePeer | tl.TypeInputUser,
): boolean {
    const state = client.storage.self.getCached()
    if (!state) return false

    switch (peer._) {
        case 'inputPeerSelf':
        case 'inputUserSelf':
            return true
        case 'inputPeerUser':
        case 'inputPeerUserFromMessage':
        case 'inputUser':
        case 'inputUserFromMessage':
        case 'peerUser':
            return peer.userId === state.userId
        default:
            return false
    }
}
