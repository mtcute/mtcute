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
import { start } from './auth/start.js'
// @copy
import {
    enableUpdatesProcessing,
    makeParsedUpdateHandler,
    ParsedUpdateHandlerParams,
    UpdatesManagerParams,
} from './updates/index.js'

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
    if (!opts.disableUpdates) {
        const { messageGroupingInterval, ...managerParams } = opts.updates ?? {}

        enableUpdatesProcessing(this, {
            ...managerParams,
            onUpdate: makeParsedUpdateHandler({
                messageGroupingInterval,
                onUpdate: (update) => {
                    Conversation.handleUpdate(this, update)
                    this.emit('update', update)
                    this.emit(update.name, update.data)
                },
                onRawUpdate: (update, peers) => {
                    this.emit('raw_update', update, peers)
                },
            }),
        })

        this.start = async (params) => {
            const user = await start(this, params)
            await this.startUpdatesLoop()

            return user
        }
    } else {
        this.start = start.bind(null, this)
    }
    this.run = (params, then) => {
        this.start(params)
            .then(then)
            .catch((err) => this._emitError(err))
    }
}
