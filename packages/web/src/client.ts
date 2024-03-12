import { ITelegramStorageProvider, PartialOnly } from '@mtcute/core'
import {
    BaseTelegramClient as BaseTelegramClientBase,
    BaseTelegramClientOptions as BaseTelegramClientOptionsBase,
    TelegramClient as TelegramClientBase,
    TelegramClientOptions,
} from '@mtcute/core/client.js'
import { setPlatform } from '@mtcute/core/platform.js'

import { WebCryptoProvider } from './crypto.js'
import { IdbStorage } from './idb/index.js'
import { WebPlatform } from './platform.js'
import { WebSocketTransport } from './websocket.js'

export type { TelegramClientOptions }

export interface BaseTelegramClientOptions
    extends PartialOnly<Omit<BaseTelegramClientOptionsBase, 'storage'>, 'transport' | 'crypto'> {
    /**
     * Storage to use for this client.
     *
     * If a string is passed, it will be used as
     * a name for an IndexedDB database.
     *
     * @default `"client.session"`
     */
    storage?: string | ITelegramStorageProvider

    /**
     * **ADVANCED USE ONLY**
     *
     * Whether to not set up the platform.
     * This is useful if you call `setPlatform` yourself.
     */
    platformless?: boolean
}

export class BaseTelegramClient extends BaseTelegramClientBase {
    constructor(opts: BaseTelegramClientOptions) {
        if (!opts.platformless) setPlatform(new WebPlatform())

        super({
            crypto: new WebCryptoProvider(),
            transport: () => new WebSocketTransport(),
            ...opts,
            storage:
                typeof opts.storage === 'string' ?
                    new IdbStorage(opts.storage) :
                    opts.storage ?? new IdbStorage('client.session'),
        })
    }
}

/**
 * Telegram client for use in Node.js
 */
export class TelegramClient extends TelegramClientBase {
    constructor(opts: TelegramClientOptions) {
        if ('client' in opts) {
            super(opts)

            return
        }

        super({
            client: new BaseTelegramClient(opts),
        })
    }
}
