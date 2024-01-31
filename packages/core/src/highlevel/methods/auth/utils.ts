import { tl } from '@mtcute/tl'

import { ITelegramClient } from '../../client.types.js'
import { User } from '../../types/peers/user.js'

/** @internal */
export async function _onAuthorization(
    client: ITelegramClient,
    auth: tl.auth.TypeAuthorization,
): Promise<User> {
    const user = await client.notifyLoggedIn(auth)

    return new User(user)
}

/**
 * Check if the given peer/input peer is referring to the current user
 */
export function isSelfPeer(
    client: ITelegramClient,
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
