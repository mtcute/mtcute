import { TelegramClient, User } from '@mtcute/client'
import { BaseTelegramClient } from '@mtcute/core'
import { HtmlMessageEntityParser } from '@mtcute/html-parser'
import { MarkdownMessageEntityParser } from '@mtcute/markdown-parser'
import { SqliteStorage } from '@mtcute/sqlite'
import { createInterface, Interface as RlInterface } from 'readline'

export * from '@mtcute/dispatcher'
export * from '@mtcute/client'
export * from '@mtcute/html-parser'
export * from '@mtcute/markdown-parser'
export { SqliteStorage }

let nativeCrypto: any
try {
    nativeCrypto = require('@mtcute/crypto-node').NodeNativeCryptoProvider
} catch (e) {}

export namespace NodeTelegramClient {
    export interface Options
        extends Omit<BaseTelegramClient.Options, 'storage'> {
        /**
         * Default parse mode to use.
         *
         * Both HTML and Markdown parse modes are
         * registered automatically.
         *
         * Defaults to `html`
         */
        defaultParseMode?: 'html' | 'markdown'

        /**
         * Storage to use.
         *
         * You can pass a file name as a simple string,
         * which will be passed directly to `SqliteStorage`
         *
         * Defaults to SQLite storage in `client.session` file in
         * current working directory
         */
        storage?: BaseTelegramClient.Options['storage'] | string
    }
}

/**
 * Tiny wrapper over `TelegramClient` for usage inside Node JS.
 *
 * This automatically sets the parse modes, native
 * crypto addon and defaults to SQLite session.
 */
export class NodeTelegramClient extends TelegramClient {
    constructor(opts: NodeTelegramClient.Options) {
        super({
            crypto: nativeCrypto ? () => new nativeCrypto() : undefined,
            ...opts,
            storage:
                typeof opts.storage === 'string'
                    ? new SqliteStorage(opts.storage)
                    : opts.storage ?? new SqliteStorage('client.session'),
        })

        this.registerParseMode(new HtmlMessageEntityParser())
        this.registerParseMode(new MarkdownMessageEntityParser())
        if (opts.defaultParseMode)
            this.setDefaultParseMode(opts.defaultParseMode)
    }

    private _rl?: RlInterface

    /**
     * Tiny wrapper over Node `readline` package
     * for simpler user input for `.run()` method.
     *
     * Associated `readline` interface is closed
     * after `run()` returns, or with the client.
     *
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

        return new Promise((res) => this._rl!.question(text, res))
    }

    start(params: Parameters<TelegramClient['start']>[0] = {}): Promise<User> {
        if (!params.botToken) {
            if (!params.phone) params.phone = () => this.input('Phone > ')
            if (!params.code) params.code = () => this.input('Code > ')
            if (!params.password)
                params.password = () => this.input('2FA password > ')
        }

        return super.start(params).then((user) => {
            if (this._rl) {
                this._rl.close()
                delete this._rl
            }

            return user
        })
    }

    close(): Promise<void> {
        this._rl?.close()
        return super.close()
    }
}
