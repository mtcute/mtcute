import { TelegramClient } from '../../client'
import { tl } from '@mtcute/tl'
import {
    UpdateHandler,
    Message,
    ContinuePropagation,
    PropagationSymbol,
    StopPropagation,
} from '../../types'
import { createUsersChatsIndex } from '../../utils/peer-utils'

// @extension
interface DispatcherExtension {
    _groups: Record<number, UpdateHandler[]>
    _groupsOrder: number[]
}

// @initialize
function _initializeDispatcher() {
    this._groups = {}
    this._groupsOrder = []
}

/**
 * @internal
 */
export function _dispatchUpdate(
    this: TelegramClient,
    update: tl.TypeUpdate | tl.TypeMessage,
    users: Record<number, tl.TypeUser>,
    chats: Record<number, tl.TypeChat>
): void {
    ;(async () => {
        // order does not matter in the dispatcher,
        // so we can handle each update in its own task

        const isRawMessage = tl.isAnyMessage(update)

        let message: Message | null = null
        if (
            update._ === 'updateNewMessage' ||
            update._ === 'updateNewChannelMessage' ||
            update._ === 'updateNewScheduledMessage' ||
            update._ === 'updateEditMessage' ||
            update._ === 'updateEditChannelMessage' ||
            isRawMessage
        ) {
            message = new Message(
                this,
                isRawMessage ? update : (update as any).message,
                users,
                chats
            )
        }

        for (const grp of this._groupsOrder) {
            for (const handler of this._groups[grp]) {
                let result: void | PropagationSymbol

                if (
                    handler.type === 'raw' &&
                    !isRawMessage &&
                    (!handler.check ||
                        (await handler.check(
                            this,
                            update as any,
                            users,
                            chats
                        )))
                ) {
                    result = await handler.callback(
                        this,
                        update as any,
                        users,
                        chats
                    )
                } else if (
                    handler.type === 'new_message' &&
                    message &&
                    (!handler.check || (await handler.check(message, this)))
                ) {
                    result = await handler.callback(message, this)
                } else continue

                if (result === ContinuePropagation) continue
                if (result === StopPropagation) return

                break
            }
        }
    })().catch((err) => this._emitError(err))
}

/**
 * Add an update handler to a given handlers group
 *
 * @param handler  Update handler
 * @param group  Handler group index
 * @internal
 */
export function addUpdateHandler(
    this: TelegramClient,
    handler: UpdateHandler,
    group = 0
): void {
    if (!(group in this._groups)) {
        this._groups[group] = []
        this._groupsOrder.push(group)
        this._groupsOrder.sort((a, b) => a - b)
    }

    this._groups[group].push(handler)
}

/**
 * Remove an update handler (or handlers) from a given
 * handler group.
 *
 * @param handler  Update handler to remove, its type or `'all'` to remove all
 * @param group  Handler group index
 * @internal
 */
export function removeUpdateHandler(
    this: TelegramClient,
    handler: UpdateHandler | UpdateHandler['type'] | 'all',
    group = 0
): void {
    if (!(group in this._groups)) {
        return
    }

    if (typeof handler === 'string') {
        if (handler === 'all') {
            delete this._groups[group]
        } else {
            this._groups[group] = this._groups[group].filter(
                (h) => h.type !== handler
            )
        }
        return
    }

    if (!(handler.type in this._groups[group])) {
        return
    }

    const idx = this._groups[group].indexOf(handler)
    if (idx > 0) {
        this._groups[group].splice(idx, 1)
    }
}
