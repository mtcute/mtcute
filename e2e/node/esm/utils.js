import { MemoryStorage } from '@mtcute/core'
import { setPlatform } from '@mtcute/core/platform.js'
import { LogManager } from '@mtcute/core/utils.js'
import { NodePlatform, TcpTransport } from '@mtcute/node'
import { NodeCryptoProvider } from '@mtcute/node/utils.js'

export const getApiParams = () => {
    if (!process.env.API_ID || !process.env.API_HASH) {
        throw new Error('API_ID and API_HASH env variables must be set')
    }

    setPlatform(new NodePlatform())

    return {
        apiId: parseInt(process.env.API_ID),
        apiHash: process.env.API_HASH,
        testMode: true,
        storage: new MemoryStorage(),
        logLevel: LogManager.DEBUG,
        transport: () => new TcpTransport(),
        crypto: new NodeCryptoProvider(),
    }
}
