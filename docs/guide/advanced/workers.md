# Workers

To facilitate parallel processing and avoid blocking the main thread, mtcute
supports extractnig the heavy lifting to the workers. This is especially useful
in the browser, where the main thread is often busy with rendering and other tasks.

::: warning
Workers support is still experimental and may have some rough edges.
If something doesn't work in a worker, but works when used directly, please open an issue.
:::

## Browser

`@mtcute/web` package exports a `TelegramWorker` and `TelegramWorkerPort` classes,
which can be used to create workers and communicate with them.

To create a worker, use the `TelegramWorker` class:

```ts
import { BaseTelegramClient, TelegramWorker } from '@mtcute/web'

const tg = new BaseTelegramClient({
    apiId: 123456,
    apiHash: '...',
})

new TelegramWorker({
    client: tg,
})
```

To communicate with the worker, use the `TelegramWorkerPort` class and pass an instance of
`Worker` (or `SharedWorker`) to it:

```ts
import { TelegramWorkerPort } from '@mtcute/web'

const port = new TelegramWorkerPort({
    worker: new Worker(
        new URL('./worker.ts', import.meta.url), 
        { type: 'module' },
    })
})
```

## Node.js

On the surface, the API is largely the same, but is slightly different under the hood
and uses `worker_threads` instead of web workers.

The worker is created the same way, but using `TelegramWorker` class from `@mtcute/node`:

```ts
import { BaseTelegramClient, TelegramWorker } from '@mtcute/node'

const tg = new BaseTelegramClient({
    apiId: 123456,
    apiHash: '...',
})

new TelegramWorker({
    client: tg,
})
```

Then, to communicate with the worker, use the `TelegramWorkerPort` class and pass an instance of `Worker` to it:

```ts
import { Worker } from 'worker_threads'
import { TelegramWorkerPort } from '@mtcute/node'

const port = new TelegramWorkerPort({
    worker: new Worker(
        new URL('./worker.js', import.meta.url), 
        { type: 'module' },
    ),
})
```


## Usage 

`TelegramWorkerPort` is a drop-in replacement for `BaseTelegramClient`, and since it 
implements `ITelegramClient`, you can pass it to any method that expects a client:

```ts
import { sendText } from '@mtcute/web/methods.js'

await sendText(port, 'me', 'Hello from worker!')
```

Alternatively, you can pass the port as a cliant to `TelegramClient` 
to bind it to all methods (not recommended in browser, see [Tree-shaking](./treeshaking.md)):

```ts
const tg = new TelegramClient({ client: port })

await tg.sendText('me', 'Hello from worker!')
```

## Other runtimes

In other runtimes it may also make sense to use workers.
If your runtime supports web workers, you can use the `@mtcute/web` package to create workers - it should work just fine.

Otherwise, Please refer to 
[Web](https://github.com/mtcute/mtcute/blob/master/packages/web/src/worker.ts)/[Node.js](https://github.com/mtcute/mtcute/blob/master/packages/node/src/worker.ts)
for the platform-specific worker implementations, and use them as a reference to create your own worker implementation.

