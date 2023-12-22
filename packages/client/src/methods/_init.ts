/* eslint-disable @typescript-eslint/no-unused-vars */

import { BaseTelegramClientOptions, ITelegramStorage } from '@mtcute/core'
// @copy
import { MemoryStorage } from '@mtcute/core/src/storage/memory.js'

import { TelegramClient } from '../client.js'
// @copy
import { Conversation } from '../types/conversation.js'
// @copy
import { _defaultStorageFactory } from '../utils/platform/storage.js'
// @copy
import { setupAuthState } from './auth/_state.js'
// @copy
import {
    enableUpdatesProcessing,
    makeParsedUpdateHandler,
    ParsedUpdateHandlerParams,
    UpdatesManagerParams,
} from './updates/index.js'

// @extension
interface TelegramClientExt {
    _disableUpdatesManager: boolean
}

// @copy
interface TelegramClientOptions extends Omit<BaseTelegramClientOptions, 'storage'> {
    /**
     * Storage to use for this client.
     *
     * If a string is passed, it will be used as:
     *   - a path to a JSON file for Node.js
     *   - IndexedDB database name for browsers
     *
     * If omitted, {@link MemoryStorage} is used
     */
    storage?: string | ITelegramStorage

    /**
     * Parameters for updates manager.
     */
    updates?: Omit<ParsedUpdateHandlerParams & UpdatesManagerParams, 'onUpdate' | 'onRawUpdate'>

    /**
     * **ADVANCED**
     *
     * If set to `true`, updates manager will not be created,
     * and only raw TL Updates will be emitted.
     *
     * Unlike {@link TelegramClientOptions.disableUpdates}, this
     * does not prevent the updates from being sent by the server,
     * but disables proper handling of them (see [Working with Updates](https://core.telegram.org/api/updates))
     *
     * This may be useful in some cases when you require more control over
     * the updates or to minimize additional overhead from properly handling them
     * for some very particular use cases.
     *
     * The updates **will not** be dispatched the normal way, instead
     * you should manually add a handler using `client.network.setUpdateHandler`.
     */
    disableUpdatesManager?: boolean

    /**
     * If `true`, the updates that were handled by some {@link Conversation}
     * will not be dispatched any further.
     *
     * @default  true
     */
    skipConversationUpdates?: boolean
}

// @initialize=super
/** @internal */
function _initializeClientSuper(this: TelegramClient, opts: TelegramClientOptions) {
    if (typeof opts.storage === 'string') {
        opts.storage = _defaultStorageFactory(opts.storage)
    } else if (!opts.storage) {
        opts.storage = new MemoryStorage()
    }

    /* eslint-disable @typescript-eslint/no-unsafe-call */
    // @ts-expect-error codegen
    super(opts)
    /* eslint-enable @typescript-eslint/no-unsafe-call */
}

// @initialize
/** @internal */
function _initializeClient(this: TelegramClient, opts: TelegramClientOptions) {
    this._disableUpdatesManager = opts.disableUpdatesManager ?? false
    const skipConversationUpdates = opts.skipConversationUpdates ?? true

    if (!opts.disableUpdates && !opts.disableUpdatesManager) {
        const { messageGroupingInterval, ...managerParams } = opts.updates ?? {}

        enableUpdatesProcessing(this, {
            ...managerParams,
            onUpdate: makeParsedUpdateHandler({
                messageGroupingInterval,
                onUpdate: (update) => {
                    if (Conversation.handleUpdate(this, update) && skipConversationUpdates) return

                    this.emit('update', update)
                    this.emit(update.name, update.data)
                },
                onRawUpdate: (update, peers) => {
                    this.emit('raw_update', update, peers)
                },
            }),
        })
    } else {
        setupAuthState(this)
    }
}
