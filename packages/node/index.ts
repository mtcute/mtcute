import { TelegramClient, User } from '@mtcute/client'
import { BaseTelegramClient } from '@mtcute/core'
import type { NodeNativeCryptoProvider } from '@mtcute/crypto-node'
import { HtmlMessageEntityParser } from '@mtcute/html-parser'
import { MarkdownMessageEntityParser } from '@mtcute/markdown-parser'
import { SqliteStorage } from '@mtcute/sqlite'
import { createInterface, Interface as RlInterface } from 'readline'

export * from '@mtcute/dispatcher'
export * from '@mtcute/client'
export { SqliteStorage }

let nativeCrypto: typeof NodeNativeCryptoProvider | null
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
         * Defaults to SQLite storage in `session.db` file in
         * current working directory
         */
        storage?: BaseTelegramClient.Options['storage'] | string
    }
}

let rl: RlInterface | null = null

/**
 * Tiny wrapper over Node `readline` package
 * for simpler user input for `.run()` method
 *
 * @param text  Text of the question
 */
export const input = (text: string): Promise<string> => {
    if (!rl) {
        rl = createInterface({
            input: process.stdin,
            output: process.stdout,
        })
    }

    return new Promise((res) => rl!.question(text, res))
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
            crypto: nativeCrypto ? () => new nativeCrypto!() : undefined,
            ...opts,
            storage:
                typeof opts.storage === 'string'
                    ? new SqliteStorage(opts.storage)
                    : opts.storage ?? new SqliteStorage('session.db'),
        })

        this.registerParseMode(new HtmlMessageEntityParser())
        this.registerParseMode(new MarkdownMessageEntityParser())
        if (opts.defaultParseMode)
            this.setDefaultParseMode(opts.defaultParseMode)
    }

    run(
        params: Parameters<TelegramClient['start']>[0],
        then?: (user: User) => void | Promise<void>
    ): void {
        if (!params.botToken) {
            if (!params.phone) params.phone = () => input('Phone > ')
            if (!params.code) params.code = () => input('Code > ')
            if (!params.password) params.password = () => input('2FA password > ')
        }

        return super.run(params, then)
    }
}