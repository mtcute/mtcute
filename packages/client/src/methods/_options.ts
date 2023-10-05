/* eslint-disable @typescript-eslint/no-unused-vars */

import { BaseTelegramClientOptions } from '@mtcute/core'

// @copy
interface TelegramClientOptions extends BaseTelegramClientOptions {
    /**
     * **ADVANCED**
     *
     * Whether to disable no-dispatch mechanism.
     *
     * No-dispatch is a mechanism that allows you to call methods
     * that return updates and correctly handle them, without
     * actually dispatching them to the event handlers.
     *
     * In other words, the following code will work differently:
     * ```ts
     * dp.onNewMessage(console.log)
     * console.log(await tg.sendText('me', 'hello'))
     * ```
     * - if `disableNoDispatch` is `true`, the sent message will be
     *   dispatched to the event handler, thus it will be printed twice
     * - if `disableNoDispatch` is `false`, the sent message will not be
     *   dispatched to the event handler, thus it will onlt be printed once
     *
     * Disabling it also may improve performance, but it's not guaranteed.
     *
     * @default false
     */
    disableNoDispatch?: boolean

    /**
     * Limit of {@link resolvePeerMany} internal async pool.
     *
     * Higher value means more parallel requests, but also
     * higher risk of getting flood-wait errors.
     * Most resolves will however likely be a DB cache hit.
     *
     * Only change this if you know what you're doing.
     *
     * @default 8
     */
    resolvePeerManyPoolLimit?: number

    /**
     * When non-zero, allows the library to automatically handle Telegram
     * media groups (e.g. albums) in {@link MessageGroup} updates
     * in a given time interval (in ms).
     *
     * **Note**: this does not catch messages that happen to be consecutive,
     * only messages belonging to the same "media group".
     *
     * This will cause up to `messageGroupingInterval` delay
     * in handling media group messages.
     *
     * This option only applies to `new_message` updates,
     * and the updates being grouped **will not** be dispatched on their own.
     *
     * Recommended value is 250 ms.
     *
     * @default  0 (disabled)
     */
    messageGroupingInterval?: number
}
