import { join } from 'node:path'

import type { MaybePromise } from '@mtcute/core'
import { MemoryStorage } from '@mtcute/core'
import { setPlatform } from '@mtcute/core/platform.js'
import { LogManager, sleep } from '@mtcute/core/utils.js'
import { NodePlatform, SqliteStorage, TcpTransport } from '@mtcute/node'
import { NodeCryptoProvider } from '@mtcute/node/utils.js'
import type { BaseTelegramClientOptions } from '@mtcute/core/client.js'

export function getApiParams(storage?: string): BaseTelegramClientOptions {
    if (!process.env.API_ID || !process.env.API_HASH) {
        throw new Error('API_ID and API_HASH env variables must be set')
    }

    setPlatform(new NodePlatform())

    return {
        apiId: Number.parseInt(process.env.API_ID),
        apiHash: process.env.API_HASH,
        testMode: true,
        storage: storage ? new SqliteStorage(join(__dirname, storage)) : new MemoryStorage(),
        logLevel: LogManager.VERBOSE,
        transport: () => new TcpTransport(),
        crypto: new NodeCryptoProvider(),
    }
}

export async function waitFor(condition: () => MaybePromise<void>, timeout = 5000): Promise<void> {
    const start = Date.now()
    let lastError

    while (Date.now() - start < timeout) {
        try {
            await condition()

            return
        } catch (e) {
            lastError = e
            await sleep(100)
        }
    }

    throw lastError
}
