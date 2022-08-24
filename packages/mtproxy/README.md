# @mtcute/mtproxy

![](./coverage.svg)

MTProto proxy (MTProxy) transport for mtcute.

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
