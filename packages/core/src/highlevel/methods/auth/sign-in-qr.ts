import type { MaybePromise } from '../../../types/utils.js'
import type { ITelegramClient } from '../../client.types.js'

import type { MaybeDynamic } from '../../types/index.js'
import { base64, Deferred } from '@fuman/utils'
import { tl } from '@mtcute/tl'
import { sleepWithAbort } from '../../../utils/misc-utils.js'
import { assertTypeIs } from '../../../utils/type-assertions.js'
import { User } from '../../types/index.js'
import { resolveMaybeDynamic } from '../../utils/misc-utils.js'

import { checkPassword } from './check-password.js'

// @available=user
/**
 * Execute the [QR login flow](https://core.telegram.org/api/qr-login).
 *
 * This method will resolve once the authorization is complete,
 * returning the authorized user.
 */
export async function signInQr(
    client: ITelegramClient,
    params: {
        /**
         * Function that will be called whenever the login URL is changed.
         *
         * The app is expected to display `url` as a QR code to the user
         */
        onUrlUpdated: (url: string, expires: Date) => void

        /**
         * Function that will be called when the user has scanned the QR code
         * (i.e. when `updateLoginToken` is received), and the library is finalizing the auth
         */
        onQrScanned?: () => void

        /** Password for 2FA */
        password?: MaybeDynamic<string>

        /**
         * Function that will be called after the server has rejected the password.
         *
         * Note that in case {@link password} is not a function,
         * this callback will never be called, and an error will be thrown instead.
         */
        invalidPasswordCallback?: () => MaybePromise<void>

        /** Abort signal */
        abortSignal?: AbortSignal
    },
): Promise<User> {
    const { onUrlUpdated, abortSignal, onQrScanned } = params

    let waiter: Deferred<void> | undefined

    // NB: at this point update manager is not active yet, so we can't use onRawUpdate
    const onUpdate = (update: tl.TypeUpdates) => {
        if (update._ === 'updateShort' && update.update._ === 'updateLoginToken') {
            onQrScanned?.()
            waiter?.resolve()
            client.onServerUpdate.remove(onUpdate)
        }
    }

    client.onServerUpdate.add(onUpdate)

    abortSignal?.addEventListener('abort', () => {
        client.onServerUpdate.remove(onUpdate)
        waiter?.reject(abortSignal.reason)
    })

    async function handle2fa(input: MaybeDynamic<string>) {
        const isDynamic = typeof input === 'function'

        while (true) {
            const password = await resolveMaybeDynamic(input)

            try {
                return await checkPassword(client, password)
            } catch (e) {
                if (tl.RpcError.is(e, 'PASSWORD_HASH_INVALID')) {
                    if (!isDynamic) {
                        throw e
                    }

                    if (params.invalidPasswordCallback) {
                        await params.invalidPasswordCallback?.()
                    } else {
                        // eslint-disable-next-line no-console
                        console.log('Invalid password. Please try again')
                    }
                    continue
                }

                throw e
            }
        }
    }

    try {
        const { id, hash } = await client.getApiCredentials()

        loop: while (true) {
            let res: tl.auth.TypeLoginToken

            try {
                res = await client.call(
                    {
                        _: 'auth.exportLoginToken',
                        apiId: id,
                        apiHash: hash,
                        exceptIds: [],
                    },
                    { abortSignal },
                )
            } catch (e) {
                if (tl.RpcError.is(e, 'SESSION_PASSWORD_NEEDED') && params.password) {
                    return await handle2fa(params.password)
                }

                throw e
            }

            switch (res._) {
                case 'auth.loginToken':
                    onUrlUpdated(
                        `tg://login?token=${base64.encode(res.token, true)}`,
                        new Date(res.expires * 1000),
                    )

                    waiter = new Deferred()
                    await Promise.race([
                        waiter.promise,
                        sleepWithAbort(res.expires * 1000 - Date.now(), client.stopSignal),
                    ])
                    break
                case 'auth.loginTokenMigrateTo': {
                    await client.changePrimaryDc(res.dcId)

                    let res2: tl.auth.TypeLoginToken

                    try {
                        res2 = await client.call(
                            {
                                _: 'auth.importLoginToken',
                                token: res.token,
                            },
                            { abortSignal },
                        )
                    } catch (e) {
                        if (tl.RpcError.is(e, 'SESSION_PASSWORD_NEEDED') && params.password) {
                            return await handle2fa(params.password)
                        }

                        throw e
                    }

                    assertTypeIs('auth.importLoginToken', res2, 'auth.loginTokenSuccess')
                    break loop
                }
                case 'auth.loginTokenSuccess':
                    break loop
            }
        }

        const [self] = await client.call(
            {
                _: 'users.getUsers',
                id: [{ _: 'inputUserSelf' }],
            },
            { abortSignal },
        )
        assertTypeIs('users.getUsers', self, 'user')

        await client.notifyLoggedIn(self)

        return new User(self)
    } finally {
        client.onServerUpdate.remove(onUpdate)
    }
}
