/* eslint-disable @typescript-eslint/no-unused-vars */

// @copy
import { MtUnsupportedError, PartialOnly } from '../../types/index.js'
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
type TelegramClientOptions = (
    | (PartialOnly<Omit<BaseTelegramClientOptions, 'storage'>, 'transport' | 'crypto'> & {
          /**
           * Storage to use for this client.
           *
           * If a string is passed, it will be used as
           * a name for the default platform-specific storage provider to use.
           *
           * @default `"client.session"`
           */
          storage?: string | ITelegramStorageProvider
      })
    | { client: ITelegramClient }
) & {
    /**
     * If true, all API calls will be wrapped with `tl.invokeWithoutUpdates`,
     * effectively disabling the server-sent events for the clients.
     * May be useful in some cases.
     *
     * @default false
     */
    disableUpdates?: boolean
    updates?: Omit<ParsedUpdateHandlerParams, 'onUpdate'>
    /**
     * If `true`, the updates that were handled by some {@link Conversation}
     * will not be dispatched any further.
     *
     * @default  true
     */
    skipConversationUpdates?: boolean
}

// @initialize
/** @internal */
function _initializeClient(this: TelegramClient, opts: TelegramClientOptions) {
    if ('client' in opts) {
        this._client = opts.client
    } else {
        if (!opts.storage || typeof opts.storage === 'string' || !opts.transport || !opts.crypto) {
            throw new MtUnsupportedError(
                'You need to explicitly provide storage, transport and crypto for @mtcute/core',
            )
        }

        this._client = new BaseTelegramClient(opts as BaseTelegramClientOptions)
    }

    // @ts-expect-error codegen
    this.log = this._client.log
    // @ts-expect-error codegen
    this.storage = this._client.storage
    Object.defineProperty(this, 'stopSignal', {
        get: () => this._client.stopSignal,
    })

    if (!opts.disableUpdates) {
        const skipConversationUpdates = opts.skipConversationUpdates ?? true
        const { messageGroupingInterval } = opts.updates ?? {}

        this._client.onUpdate(
            makeParsedUpdateHandler({
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
        )
    }
}
