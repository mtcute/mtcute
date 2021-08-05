import { BaseTelegramClient, NodeCryptoProvider, TcpTransport } from '../../src'

// require('debug').enable('mtcute:*')

export function createTestTelegramClient() {
    return new BaseTelegramClient({
        // provided explicitly because mocha
        crypto: () => new NodeCryptoProvider(),
        transport: () => new TcpTransport(),
        // example values from tdlib
        apiId: 94575,
        apiHash: 'a3406de8d171bb422bb6ddf3bbd800e2',
        testMode: true
    })
}
