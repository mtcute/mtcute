/* eslint-disable @typescript-eslint/no-unused-vars */

// @copy
import { MemoryStorage } from '../../storage/providers/memory/index.js'
import { BaseTelegramClient, BaseTelegramClientOptions } from '../base.js'
import { TelegramClient } from '../client.js'
import { ITelegramClient } from '../client.types.js'
// @copy
import { ITelegramStorageProvider } from '../storage/provider.js'
// @copy
import { Conversation } from '../types/conversation.js'
// @copy
import { makeParsedUpdateHandler, ParsedUpdateHandlerParams } from '../updates/parsed.js'
// @copy
import { _defaultStorageFactory } from '../utils/platform/storage.js'

// @copy
type TelegramClientOptions = ((Omit<BaseTelegramClientOptions, 'storage'> & {
    /**
     * Storage to use for this client.
     *
     * If a string is passed, it will be used as:
     *   - a path to a JSON file for Node.js
     *   - IndexedDB database name for browsers
     *
     * If omitted, {@link MemoryStorage} is used
     */
    storage?: string | ITelegramStorageProvider
}) | ({ client: ITelegramClient })) & {
    updates?: Omit<ParsedUpdateHandlerParams, 'onUpdate'>
    /**
     * If `true`, the updates that were handled by some {@link Conversation}
     * will not be dispatched any further.
     *
     * @default  true
     */
    skipConversationUpdates?: boolean
}

// // @initialize=super
// /** @internal */
// function _initializeClientSuper(this: TelegramClient, opts: TelegramClientOptions) {
//     if (typeof opts.storage === 'string') {
//         opts.storage = _defaultStorageFactory(opts.storage)
//     } else if (!opts.storage) {
//         opts.storage = new MemoryStorage()
//     }

//     /* eslint-disable @typescript-eslint/no-unsafe-call */
//     // @ts-expect-error codegen
//     super(opts)
//     /* eslint-enable @typescript-eslint/no-unsafe-call */
// }

// @initialize
/** @internal */
function _initializeClient(this: TelegramClient, opts: TelegramClientOptions) {
    if ('client' in opts) {
        this._client = opts.client
    } else {
        let storage: ITelegramStorageProvider

        if (typeof opts.storage === 'string') {
            storage = _defaultStorageFactory(opts.storage)
        } else if (!opts.storage) {
            storage = new MemoryStorage()
        } else {
            storage = opts.storage
        }

        this._client = new BaseTelegramClient({
            ...opts,
            storage,
        })
    }

    // @ts-expect-error codegen
    this.log = this._client.log
    // @ts-expect-error codegen
    this.storage = this._client.storage

    const skipConversationUpdates = opts.skipConversationUpdates ?? true
    const { messageGroupingInterval } = opts.updates ?? {}

    this._client.onUpdate(makeParsedUpdateHandler({
        messageGroupingInterval,
        onUpdate: (update) => {
            if (Conversation.handleUpdate(this._client, update) && skipConversationUpdates) return

            this.emit('update', update)
            this.emit(update.name, update.data)
        },
        onRawUpdate: (update, peers) => {
            this.emit('raw_update', update, peers)
        },
    }))
}
