# @mtcute/node

📖 [API Reference](https://ref.mtcute.dev/modules/_mtcute_node.html)

All-in-one package for NodeJS. Includes support for native crypto addon
(must be installed separately, `@mtcute/crypto-node`), terminal I/O via
`readline` and comes with pre-installed HTML and Markdown parsers.

## Usage

```typescript
import { NodeTelegramClient } from '@mtcute/node'

const tg = new NodeTelegramClient({
    apiId: 12345,
    apiHash: 'abcdef',
    storage: 'my-account'
})
```
