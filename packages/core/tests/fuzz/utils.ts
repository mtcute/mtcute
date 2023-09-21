import { BaseTelegramClient, TcpTransport } from '../../src'
import { NodeCryptoProvider } from '../../utils'

export function createTestTelegramClient() {
    const tg = new BaseTelegramClient({
        // provided explicitly because mocha
        crypto: () => new NodeCryptoProvider(),
        transport: () => new TcpTransport(),
        // example values from tdlib
        apiId: 94575,
        apiHash: 'a3406de8d171bb422bb6ddf3bbd800e2',
        testMode: true,
    })
    tg.log.level = 0

    return tg
}
