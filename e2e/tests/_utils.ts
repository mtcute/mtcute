import type { BaseTelegramClientOptions, MaybePromise } from 'mtcute'

import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { sleep } from '@fuman/utils'
import { MemoryStorage, SqliteStorage } from 'mtcute'
import { LogManager } from 'mtcute/utils.js'

export const RUNTIME_DIR: string = fileURLToPath(new URL('../_runtime', import.meta.url))
export const IS_DENO = 'Deno' in globalThis
export const IS_BUN = 'Bun' in globalThis
export const IS_NODE = !IS_DENO && !IS_BUN

export function getApiParams(storage?: string): BaseTelegramClientOptions {
    if (!process.env.API_ID || !process.env.API_HASH) {
        throw new Error('API_ID and API_HASH env variables must be set')
    }

    return {
        apiId: Number.parseInt(process.env.API_ID),
        apiHash: process.env.API_HASH,
        testMode: true,
        storage: storage ? new SqliteStorage(join(RUNTIME_DIR, storage)) : new MemoryStorage(),
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
