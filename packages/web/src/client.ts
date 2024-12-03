import type { ITelegramStorageProvider, PartialOnly } from '@mtcute/core'
import type {
    BaseTelegramClientOptions as BaseTelegramClientOptionsBase,
    TelegramClientOptions,
} from '@mtcute/core/client.js'
import {
    BaseTelegramClient as BaseTelegramClientBase,
    TelegramClient as TelegramClientBase,
} from '@mtcute/core/client.js'

import { WebCryptoProvider } from './crypto.js'
import { IdbStorage } from './idb/index.js'
import { WebPlatform } from './platform.js'
import { WebSocketTransport } from './websocket.js'

export type { TelegramClientOptions }

export interface BaseTelegramClientOptions
    extends PartialOnly<Omit<BaseTelegramClientOptionsBase, 'storage'>, 'transport' | 'crypto' | 'platform'> {
    /**
     * Storage to use for this client.
     *
     * If a string is passed, it will be used as
     * a name for an IndexedDB database.
     *
     * @default `"client.session"`
     */
    storage?: string | ITelegramStorageProvider
}

export class BaseTelegramClient extends BaseTelegramClientBase {
    constructor(opts: BaseTelegramClientOptions) {
        super({
            crypto: new WebCryptoProvider(),
            transport: new WebSocketTransport(),
            platform: new WebPlatform(),
            ...opts,
            storage:
                typeof opts.storage === 'string'
                    ? new IdbStorage(opts.storage)
                    : opts.storage ?? new IdbStorage('client.session'),
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
            disableUpdates: opts.disableUpdates,
            skipConversationUpdates: opts.skipConversationUpdates,
            updates: opts.updates,
        })
    }
}
