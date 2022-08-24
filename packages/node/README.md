# @mtcute/node

![](./coverage.svg)

All-in-one package for NodeJS. Includes support for native crypto addon
(must be installed separately, `@mtcute/crypto-node`), terminal I/O via
`readline` and comes with pre-installed HTML and Markdown parsers.

> **Note**: documentation for this package only includes changes from
> `@mtcute/client`. For full documentation, see
> [`@mtcute/client` docs](../client/index.html).

## Usage

```typescript
import { NodeTelegramClient } from '@mtcute/node'

const tg = new NodeTelegramClient({
    apiId: 12345,
    apiHash: 'abcdef',
    storage: 'client.session'
})
```
