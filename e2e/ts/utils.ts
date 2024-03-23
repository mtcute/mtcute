// eslint-disable-next-line no-restricted-imports
import { join } from 'path'

import { MaybePromise, MemoryStorage } from '@mtcute/core'
import { setPlatform } from '@mtcute/core/platform.js'
import { LogManager, sleep } from '@mtcute/core/utils.js'
import { NodeCryptoProvider, NodePlatform, SqliteStorage, TcpTransport } from '@mtcute/node'

export const getApiParams = (storage?: string) => {
    if (!process.env.API_ID || !process.env.API_HASH) {
        throw new Error('API_ID and API_HASH env variables must be set')
    }

    setPlatform(new NodePlatform())

    return {
        apiId: parseInt(process.env.API_ID),
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
