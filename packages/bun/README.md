# @mtcute/bun

📖 [API Reference](https://ref.mtcute.dev/modules/_mtcute_node.html)

‼️ **Experimental** Bun support package for mtcute. Includes:
- SQLite storage (based on `bun:sqlite`)
- TCP transport (based on Bun-native APIs)
- `TelegramClient` implementation using the above
- HTML and Markdown parsers

## Usage

```typescript
import { TelegramClient } from '@mtcute/bun'

const tg = new TelegramClient({
    apiId: 12345,
    apiHash: 'abcdef',
    storage: 'my-account'
})

tg.run(async (user) => {
    console.log(`✨ logged in as ${user.displayName}`)
})
```
