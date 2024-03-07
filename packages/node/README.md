# @mtcute/node

📖 [API Reference](https://ref.mtcute.dev/modules/_mtcute_node.html)

Node.js support package for mtcute. Includes:
- Support for native crypto addon (must be installed separately, `@mtcute/crypto-node`)
- Terminal I/O via `readline`
- SQLite storage (`@mtcute/sqlite`)
- TCP transport
- `TelegramClient` implementation using the above
- HTML and Markdown parsers

## Usage

```typescript
import { TelegramClient } from '@mtcute/node'

const tg = new TelegramClient({
    apiId: 12345,
    apiHash: 'abcdef',
    storage: 'my-account'
})

tg.run(async (user) => {
    console.log(`✨ logged in as ${user.displayName}`)
})
```
