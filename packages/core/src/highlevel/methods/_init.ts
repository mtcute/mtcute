import type { PartialOnly } from '../../types/index.js'
import { MtUnsupportedError } from '../../types/index.js'
import type { BaseTelegramClientOptions } from '../base.js'
import { BaseTelegramClient } from '../base.js'
import type { TelegramClient } from '../client.js'
import type { ITelegramClient } from '../client.types.js'
// @copy
import type { ITelegramStorageProvider } from '../storage/provider.js'
// @copy
import { Conversation } from '../types/conversation.js'
// @copy
import type { ParsedUpdateHandlerParams } from '../updates/parsed.js'
// @copy
import { makeParsedUpdateHandler } from '../updates/parsed.js'
// @copy
type TelegramClientOptions = (
    | (PartialOnly<Omit<BaseTelegramClientOptions, 'storage'>, 'transport' | 'crypto' | 'platform'> & {
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
        if (!opts.storage || typeof opts.storage === 'string' || !opts.transport || !opts.crypto || !opts.platform) {
            throw new MtUnsupportedError(
                'You need to explicitly provide storage, transport, crypto and platform for @mtcute/core',
            )
        }

        this._client = new BaseTelegramClient(opts as BaseTelegramClientOptions)
    }

    Object.defineProperty(this, 'log', { value: this._client.log })
    Object.defineProperty(this, 'storage', { value: this._client.storage })
    Object.defineProperty(this, 'stopSignal', { value: this._client.stopSignal })
    Object.defineProperty(this, 'appConfig', { value: this._client.appConfig })
    Object.defineProperty(this, 'onServerUpdate', { value: this._client.onServerUpdate })
    Object.defineProperty(this, 'onRawUpdate', { value: this._client.onServerUpdate })
    Object.defineProperty(this, 'onConnectionState', { value: this._client.onConnectionState })

    if (!opts.disableUpdates) {
        const skipConversationUpdates = opts.skipConversationUpdates ?? true
        const { messageGroupingInterval } = opts.updates ?? {}

        this._client.onRawUpdate.add(
            makeParsedUpdateHandler({
                messageGroupingInterval,
                onUpdate: (update) => {
                    if (Conversation.handleUpdate(this, update) && skipConversationUpdates) return

                    this.onUpdate.emit(update)
                    // @generate-update-emitter
                },
            }),
        )
    }
}
