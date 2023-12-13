import { createRequire } from 'module'
import { createInterface, Interface as RlInterface } from 'readline'

import { TelegramClient, TelegramClientOptions, User } from '@mtcute/client'
import { SqliteStorage } from '@mtcute/sqlite'

export * from '@mtcute/client'
export * from '@mtcute/html-parser'
export * from '@mtcute/markdown-parser'
export { SqliteStorage }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let nativeCrypto: any

try {
    // @only-if-esm
    const require = createRequire(import.meta.url)
    // @/only-if-esm
    // eslint-disable-next-line
    nativeCrypto = require('@mtcute/crypto-node').NodeNativeCryptoProvider
} catch (e) {}

/**
 * Tiny wrapper over {@link TelegramClient} for usage inside Node JS.
 *
 * This class automatically manages native
 * crypto addon and defaults to SQLite session (unlike `TelegarmClient`,
 * which defaults to a JSON file on Node).
 */
export class NodeTelegramClient extends TelegramClient {
    constructor(opts: TelegramClientOptions) {
        super({
            // eslint-disable-next-line
            crypto: nativeCrypto ? () => new nativeCrypto() : undefined,
            ...opts,
            storage:
                typeof opts.storage === 'string' ?
                    new SqliteStorage(opts.storage) :
                    opts.storage ?? new SqliteStorage('client.session'),
        })
    }

    private _rl?: RlInterface

    /**
     * Tiny wrapper over Node `readline` package
     * for simpler user input for `.run()` method.
     *
     * Associated `readline` interface is closed
     * after `run()` returns, or with the client.
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

        return new Promise((res) => this._rl?.question(text, res))
    }

    close(): Promise<void> {
        this._rl?.close()

        return super.close()
    }

    start(params: Parameters<TelegramClient['start']>[0] = {}): Promise<User> {
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
            .catch((err) => this._emitError(err))
    }
}
