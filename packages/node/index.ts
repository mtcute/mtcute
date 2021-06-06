import { TelegramClient } from '@mtcute/client'
import { BaseTelegramClient } from '@mtcute/core'
import { NodeNativeCryptoProvider } from '@mtcute/crypto-node'
import { HtmlMessageEntityParser } from '@mtcute/html-parser'
import { MarkdownMessageEntityParser } from '@mtcute/markdown-parser'
import { SqliteStorage } from '@mtcute/sqlite'

export * from '@mtcute/dispatcher'

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

/**
 * Tiny wrapper over `TelegramClient` for usage inside Node JS.
 *
 * This automatically sets the parse modes, native
 * crypto addon and defaults to SQLite session.
 */
export class NodeTelegramClient extends TelegramClient {
    constructor(opts: NodeTelegramClient.Options) {
        super({
            crypto: () => new NodeNativeCryptoProvider(),
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
}
