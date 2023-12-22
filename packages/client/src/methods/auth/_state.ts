/* eslint-disable no-inner-declarations */
import { BaseTelegramClient, MtArgumentError, MtUnsupportedError, tl } from '@mtcute/core'
import { assertTypeIs } from '@mtcute/core/utils.js'

import { User } from '../../types/peers/user.js'

const STATE_SYMBOL = Symbol('authState')

/** @exported */
export interface AuthState {
    // local copy of "self" in storage,
    // so we can use it w/out relying on storage.
    // they are both loaded and saved to storage along with the updates
    // (see methods/updates)
    userId: number | null
    isBot: boolean
    selfUsername: string | null
    selfChanged?: boolean
}

/**
 * Initialize auth state for the given client.
 *
 * Allows {@link getAuthState} to be used and is required for some methods.
 * @noemit
 */
export function setupAuthState(client: BaseTelegramClient): void {
    // eslint-disable-next-line
    let state: AuthState = (client as any)[STATE_SYMBOL]
    if (state) return

    // init
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    state = (client as any)[STATE_SYMBOL] = {
        userId: null,
        isBot: false,
        selfUsername: null,
    }

    client.log.prefix = '[USER N/A] '

    function onBeforeConnect() {
        Promise.resolve(client.storage.getSelf())
            .then((self) => {
                if (!self) return

                state.userId = self.userId
                state.isBot = self.isBot
                client.log.prefix = `[USER ${self.userId}] `
            })
            .catch((err) => client._emitError(err))
    }

    async function onBeforeStorageSave() {
        if (state.selfChanged) {
            await client.storage.setSelf(
                state.userId ?
                    {
                        userId: state.userId,
                        isBot: state.isBot,
                    } :
                    null,
            )
            state.selfChanged = false
        }
    }

    client.on('before_connect', onBeforeConnect)
    client.beforeStorageSave(onBeforeStorageSave)
    client.on('before_stop', () => {
        client.off('before_connect', onBeforeConnect)
        client.offBeforeStorageSave(onBeforeStorageSave)
    })
}

/**
 * Get auth state for the given client, containing
 * information about the current user.
 *
 * Auth state must first be initialized with {@link setupAuthState}.
 */
export function getAuthState(client: BaseTelegramClient): AuthState {
    // eslint-disable-next-line
    let state: AuthState = (client as any)[STATE_SYMBOL]

    if (!state) {
        throw new MtArgumentError('Auth state is not initialized, use setupAuthState()')
    }

    return state
}

/** @internal */
export async function _onAuthorization(
    client: BaseTelegramClient,
    auth: tl.auth.TypeAuthorization,
    bot = false,
): Promise<User> {
    if (auth._ === 'auth.authorizationSignUpRequired') {
        throw new MtUnsupportedError(
            'Signup is no longer supported by Telegram for non-official clients. Please use your mobile device to sign up.',
        )
    }

    assertTypeIs('_onAuthorization (@ auth.authorization -> user)', auth.user, 'user')

    const state = getAuthState(client)
    state.userId = auth.user.id
    state.isBot = bot
    state.selfUsername = auth.user.username ?? null
    state.selfChanged = true

    client.notifyLoggedIn(auth)
    await client.saveStorage()

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
    const state = getAuthState(client)

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
