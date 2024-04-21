const { MemoryStorage } = require('@mtcute/core')
const { setPlatform } = require('@mtcute/core/platform.js')
const { LogManager } = require('@mtcute/core/utils.js')
const { NodeCryptoProvider, NodePlatform, TcpTransport } = require('@mtcute/node')

exports.getApiParams = () => {
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
