// eslint-disable-next-line no-restricted-imports
import { join } from 'path'

import { MaybePromise, MemoryStorage } from '@mtcute/core'
import { LogManager, sleep } from '@mtcute/core/utils.js'
import { SqliteStorage } from '@mtcute/sqlite'

export const getApiParams = (storage?: string) => {
    if (!process.env.API_ID || !process.env.API_HASH) {
        throw new Error('API_ID and API_HASH env variables must be set')
    }

    return {
        apiId: parseInt(process.env.API_ID),
        apiHash: process.env.API_HASH,
        testMode: true,
        storage: storage ? new SqliteStorage(join(__dirname, storage)) : new MemoryStorage(),
        logLevel: LogManager.VERBOSE,
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
