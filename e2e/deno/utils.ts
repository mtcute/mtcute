import { MaybePromise, MemoryStorage } from '@mtcute/core'
import { setPlatform } from '@mtcute/core/platform.js'
import { LogManager, sleep } from '@mtcute/core/utils.js'
import { WebCryptoProvider, WebPlatform, WebSocketTransport } from '@mtcute/web'

export const getApiParams = (storage?: string) => {
    if (storage) throw new Error('unsupported yet')

    if (!Deno.env.has('API_ID') || !Deno.env.has('API_HASH')) {
        throw new Error('API_ID and API_HASH env variables must be set')
    }

    setPlatform(new WebPlatform())

    return {
        apiId: parseInt(Deno.env.get('API_ID')!),
        apiHash: Deno.env.get('API_HASH')!,
        testMode: true,
        storage: new MemoryStorage(),
        logLevel: LogManager.VERBOSE,
        transport: () => new WebSocketTransport(),
        crypto: new WebCryptoProvider(),
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
