import type { Interface as RlInterface } from 'node:readline'
import { createInterface } from 'node:readline'
import type { Readable } from 'node:stream'

import type { FileDownloadLocation, FileDownloadParameters, ITelegramStorageProvider, PartialOnly, User } from '@mtcute/core'
import type {
    BaseTelegramClientOptions as BaseTelegramClientOptionsBase,
    TelegramClientOptions,
} from '@mtcute/core/client.js'
import {
    BaseTelegramClient as BaseTelegramClientBase,
    TelegramClient as TelegramClientBase,
} from '@mtcute/core/client.js'
import { unknownToError } from '@fuman/utils'

import { downloadToFile } from './methods/download-file.js'
import { downloadAsNodeStream } from './methods/download-node-stream.js'
import { SqliteStorage } from './sqlite/index.js'
import { NodeCryptoProvider } from './utils/crypto.js'
import { TcpTransport } from './utils/tcp.js'
import { NodePlatform } from './common-internals-node/platform.js'

export type { TelegramClientOptions }

let nativeCrypto: any

try {
    /* eslint-disable ts/ban-ts-comment,ts/no-unsafe-assignment */

    // @ts-ignore  not in deps
    nativeCrypto = (await import('@mtcute/crypto-node')).NodeNativeCryptoProvider
    /* eslint-enable ts/ban-ts-comment,ts/no-unsafe-assignment */
} catch {}

export interface BaseTelegramClientOptions
    extends PartialOnly<Omit<BaseTelegramClientOptionsBase, 'storage'>, 'transport' | 'crypto' | 'platform'> {
    /**
     * Storage to use for this client.
     *
     * If a string is passed, it will be used as
     * a name for an SQLite database file.
     *
     * @default `"client.session"`
     */
    storage?: string | ITelegramStorageProvider

}

export class BaseTelegramClient extends BaseTelegramClientBase {
    constructor(opts: BaseTelegramClientOptions) {
        super({
            // eslint-disable-next-line
            crypto: nativeCrypto ? new nativeCrypto() : new NodeCryptoProvider(),
            transport: new TcpTransport(),
            platform: new NodePlatform(),
            ...opts,
            storage:
                typeof opts.storage === 'string'
                    ? new SqliteStorage(opts.storage)
                    : opts.storage ?? new SqliteStorage('client.session'),
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

    private _rl?: RlInterface

    /**
     * Tiny wrapper over Node `readline` package
     * for simpler user input for `.start()` method.
     *
     * Associated `readline` interface is closed
     * after `start()` returns, or with the client.
     *
     * @param text  Text of the question
     */
    input(text: string): Promise<string> {
        if (!this._rl) {
            this._rl = createInterface({
                input: process.stdin,
                output: process.stdout,
            })
        }

        return new Promise(res => this._rl?.question(text, res))
    }

    close(): Promise<void> {
        this._rl?.close()

        return super.close()
    }

    start(params: Parameters<TelegramClientBase['start']>[0] = {}): Promise<User> {
        if (!params.botToken) {
            if (!params.phone) params.phone = () => this.input('phone > ')
            if (!params.code) params.code = () => this.input('code > ')

            if (!params.password) {
                params.password = () => this.input('2fa password > ')
            }
        }

        return super.start(params).then((user) => {
            if (this._rl) {
                this._rl.close()
                delete this._rl
            }

            return user
        })
    }

    run(
        params: Parameters<TelegramClient['start']>[0] | ((user: User) => void | Promise<void>),
        then?: (user: User) => void | Promise<void>,
    ): void {
        if (typeof params === 'function') {
            then = params
            params = {}
        }

        this.start(params)
            .then(then)
            .catch(err => this.onError.emit(unknownToError(err)))
    }

    downloadToFile(
        filename: string,
        location: FileDownloadLocation,
        params?: FileDownloadParameters | undefined,
    ): Promise<void> {
        return downloadToFile(this, filename, location, params)
    }

    downloadAsNodeStream(location: FileDownloadLocation, params?: FileDownloadParameters | undefined): Readable {
        return downloadAsNodeStream(this, location, params)
    }
}
