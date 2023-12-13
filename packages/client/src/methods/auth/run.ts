import { BaseTelegramClient } from '@mtcute/core'

import { TelegramClient } from '../../index.js'
import { User } from '../../types/index.js'
import { start } from './start.js'

/**
 * Simple wrapper that calls {@link start} and then
 * provided callback function (if any) without the
 * need to introduce a `main()` function manually.
 *
 * Errors that were encountered while calling {@link start}
 * and `then` will be emitted as usual, and can be caught with {@link onError}
 *
 * @param params  Parameters to be passed to {@link start}
 * @param then  Function to be called after {@link start} returns
 * @manual=noemit
 */
export function run(
    client: BaseTelegramClient,
    params: Parameters<typeof start>[1],
    then?: (user: User) => void | Promise<void>,
): void {
    start(client, params)
        .then(then)
        .catch((err) => client._emitError(err))
}

// @manual-impl=run
/** @internal */
function _run(this: TelegramClient, params: Parameters<typeof start>[1], then?: (user: User) => void | Promise<void>) {
    this.start(params)
        .then(then)
        .catch((err) => this._emitError(err))
}
