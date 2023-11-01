# @mtcute/socks-proxy

📖 [API Reference](https://ref.mtcute.dev/modules/_mtcute_socks_proxy.html)

Socks4/5 proxy transport for mtcute.

## Usage

```typescript
import { SocksTcpTransport } from '@mtcute/socks-proxy'

const tg = new TelegramClient({
    // ...
    transport: () => new SocksTcpTransport({
        host: 'localhost',
        port: 1080,
    })
})
```
