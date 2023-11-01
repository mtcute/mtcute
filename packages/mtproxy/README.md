# @mtcute/mtproxy

📖 [API Reference](https://ref.mtcute.dev/modules/_mtcute_mtproxy.html)

MTProto proxy (MTProxy) transport for mtcute.

Supports all kinds of MTProto proxies, including obfuscated and fake TLS.

## Usage

```typescript
import { MtProxyTcpTransport } from '@mtcute/mtproxy'

const tg = new TelegramClient({
    // ...
    transport: () => new MtProxyTcpTransport({
        host: 'localhost',
        port: 443,
        secret: 'secret'
    })
})
```
