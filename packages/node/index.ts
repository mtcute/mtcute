import { createRequire } from 'module'
import { createInterface, Interface as RlInterface } from 'readline'

import { TelegramClient, TelegramClientOptions } from '@mtcute/client'
import { HtmlMessageEntityParser } from '@mtcute/html-parser'
import { MarkdownMessageEntityParser } from '@mtcute/markdown-parser'
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

export interface NodeTelegramClientOptions extends Omit<TelegramClientOptions, 'storage'> {
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
    storage?: TelegramClientOptions['storage'] | string
}

/**
 * Tiny wrapper over {@link TelegramClient} for usage inside Node JS.
 *
 * This automatically sets the parse modes, native
 * crypto addon and defaults to SQLite session.
 *
 * Documentation for this class only contains the
 * difference between {@link TelegramClient} and {@link NodeTelegramClient}.
 * For the complete documentation, please refer to {@link TelegramClient}.
 */
export class NodeTelegramClient extends TelegramClient {
    constructor(opts: NodeTelegramClientOptions) {
        super({
            // eslint-disable-next-line
            crypto: nativeCrypto ? () => new nativeCrypto() : undefined,
            ...opts,
            storage:
                typeof opts.storage === 'string' ?
                    new SqliteStorage(opts.storage) :
                    opts.storage ?? new SqliteStorage('client.session'),
        })

        this.registerParseMode(new HtmlMessageEntityParser())
        this.registerParseMode(new MarkdownMessageEntityParser())

        if (opts.defaultParseMode) {
            this.setDefaultParseMode(opts.defaultParseMode)
        }
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
}
