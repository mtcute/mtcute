import { TelegramClient } from '../../client'
import { User } from '../../types'

/**
 * Simple wrapper that calls {@link start} and then
 * provided callback function (if any) without the
 * need to introduce a `main()` function manually.
 *
 * Errors that were encountered while calling {@link start}
 * and `then` will be emitted as usual, and can be caught with {@link onError}
 *
 * @param params  Parameters to be passed to {@link TelegramClient.start}
 * @param then  Function to be called after {@link TelegramClient.start} returns
 * @internal
 */
export function run(
    this: TelegramClient,
    params: Parameters<TelegramClient['start']>[0],
    then?: (user: User) => void | Promise<void>
): void {
    this.start(params)
        .then(then)
        .catch((err) => this._emitError(err))
}
