# @mtcute/web

📖 [API Reference](https://ref.mtcute.dev/modules/_mtcute_web.html)

Web support package for mtcute. Includes:
- WASM crypto provider
- Websocket transport
- IndexedDB storage
- `TelegramClient` implementation using the above

## Usage

```typescript
import { TelegramClient } from '@mtcute/web'

const tg = new TelegramClient({
    apiId: 12345,
    apiHash: 'abcdef',
    storage: 'my-account'
})

const self = await tg.start()
console.log(`✨ logged in as ${self.displayName}`)
```

## Usage with workers

You can also use this package with web workers to offload most of the heavy lifting to a separate thread:

```typescript
// worker.ts
import { BaseTelegramClient, TelegramWorker } from '@mtcute/web'

const client = new BaseTelegramClient({
    apiId: 12345,
    apiHash: 'abcdef',
    storage: 'my-account'
})

new TelegramWorker({ client }).mount()

// main.ts
import { TelegramClient, TelegramWorkerPort } from '@mtcute/web'

const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }) // or SharedWorker
const port = new TelegramWorkerPort({ worker })
const tg = new TelegramClient({ client: port })

const self = await tg.start()
console.log(`✨ logged in as ${user.displayName}`)
```

`port.destroy()` only releases that port. Use `port.unsafeForceDestroy()` if you need to tear down the shared worker-side client.
