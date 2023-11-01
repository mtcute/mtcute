# @mtcute/http-proxy

📖 [API Reference](https://ref.mtcute.dev/modules/_mtcute_http_proxy.html)

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
