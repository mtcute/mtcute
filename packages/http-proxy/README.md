# @mtcute/http-proxy

HTTP(s) proxy transport for mtcute.

## Usage

```typescript
import { HttpProxyTcpTransport } from '@mtcute/socks-proxy'

const tg = new TelegramClient({
    // ...
    transport: () => new HttpProxyTcpTransport({
        host: 'localhost',
        port: 1080,
    })
})
```
