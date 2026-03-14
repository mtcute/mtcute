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
}).mount()
```

`TelegramWorker` construction is side-effect-free. Call `.mount()` once to bind it to the worker transport.

`TelegramWorkerPort.destroy()` only closes that logical port. It does not destroy the shared client inside the worker.

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
}).mount()
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

## Multiple clients in a single worker

If you want to use multiple clients in a single worker, you can set per-worker unique `workerId` option
when creating the worker:

```ts
new TelegramWorker({
    client: tg,
    workerId: '1',
}).mount()
new TelegramWorker({
    client: tg2,
    workerId: '2',
}).mount()
```

Then, you can pass the worker id to the port constructor:

```ts
const worker = new Worker(
    new URL('./worker.js', import.meta.url), 
    { type: 'module' },
)
const port1 = new TelegramWorkerPort({
    worker,
    workerId: '1',
})
const port2 = new TelegramWorkerPort({
    worker,
    workerId: '2',
})
```

If you want, you can even have custom message handler that will not interfere with mtcute workers:

```ts
self.addEventListener('message', message => {
    if ('_mtcuteWorkerId' in message) return // ignore mtcute workers messages

    // do whatever
})
```

::: tip
`workerId` does not need to be unique across the entire application,
just within the same worker.
:::

## MessagePort and multiple ports

`TelegramWorkerPort` can talk not only to `Worker` / `SharedWorker`, but also to a `MessagePort`.
This is useful when one worker owns the mtcute client, and another thread gets a dedicated port into it.

```ts
// main.ts
import { MessageChannel } from 'worker_threads'
import { Worker } from 'worker_threads'

const { port1, port2 } = new MessageChannel()
const worker = new Worker(new URL('./worker.js', import.meta.url)) // assuming the same code as above
const helper = new Worker(new URL('./helper.js', import.meta.url))

worker.on('message', (message) => channel.port1.postMessage(message.payload))
channel.port1.on('message', (message) => worker.postMessage(message))

helper.postMessage({
    type: 'init',
    port: channel.port2,
}, [channel.port2])
```

You can also create multiple `TelegramWorkerPort` instances for the same underlying worker:

```ts
const worker = new Worker(
    new URL('./worker.js', import.meta.url),
)

const port1 = new TelegramWorkerPort({ worker })
const port2 = new TelegramWorkerPort({ worker })
```

Each port gets its own logical connection. Requests, aborts and keepalives are isolated per port,
while the underlying mtcute client inside the worker is shared.

This means:

- disconnecting or releasing one port does not affect the other ports
- one port can have pending RPC calls without interfering with another
- worker-owned keepalives are cleaned up per port when that port is released

If you use `SharedWorker`, this is the normal model: each page gets its own port, all backed by the same worker client.

### Cleanup policies

Worker-side cleanup when the last port disappears is controlled by `onLastDisconnected`:

- `'nothing'` (default): keep the client alive
- `'disconnect'`: disconnect the client, but keep the worker process alive
- `'destroy'`: destroy the client

```ts
new TelegramWorker({
    client: tg,
    onLastDisconnected: 'disconnect',
}).mount()
```

If you need to destroy the shared client regardless of other ports, use `unsafeForceDestroy()`.
Use `destroy()` only when you want to release the current port.

## Other runtimes

In other runtimes it may also make sense to use workers.
If your runtime supports web workers, you can use the `@mtcute/web` package to create workers - it should work just fine.

Otherwise, Please refer to 
[Web](https://github.com/mtcute/mtcute/blob/master/packages/web/src/worker.ts)/[Node.js](https://github.com/mtcute/mtcute/blob/master/packages/node/src/worker.ts)
for the platform-specific worker implementations, and use them as a reference to create your own worker implementation.
