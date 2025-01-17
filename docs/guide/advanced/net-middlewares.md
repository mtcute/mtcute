# Network middlewares <Tag text="v0.16.0+" />

In some cases it may make sense to intercept *all* outgoing requests and control the request flow.

## Default middlewares

By default, mtcute uses two middlewares: flood-waiter and internal errors handler.
The combined default middleware is exported in `networkMiddlewares.basic`, and can be configured as follows:

```ts
const tg = new TelegramClient({
    ...,
    network: {
        middlewares: networkMiddlewares.basic({
            floodWaiter: { maxWait: 5000, maxRetries: 5 },
            internalErrors: { maxRetries: 5 }
        })
    }
})
```

Flood-waiter and internal errors handler middlewares themselves are exported under
`networkMiddlewares.floodWaiter` and `networkMiddlewares.internalErrorsHandler` respectively.

## Writing middlewares

Middleware is simply an async function that takes `ctx` and `next` as arguments.

The `ctx` object contains information about the RPC call, including the request itself and 
any additional parameters that were passed along, and `next` function can be used to call the 
next middleware in the chain, returning the call result (or an [error](#errors-in-middlewares)):

```ts
const myMiddleware: RpcCallMiddleware = async (ctx, next) => {
    if (ctx.request._ === 'help.getConfig') {
        return myConfig
    }

    return next(ctx)
}
```

::: info
If you are familiar with grammY/telegraf or koa middlewares, 
you might find the `ctx, next` syntax familiar. 
Indeed, these middlewares were heavily inspired by them.

However, they work slightly different here, as the task is slightly different too.

Unlike grammY-style middlewares, `next` *can* be called multiple times,
and the last pseudo-"middleware" in the chain will actually execute 
the request contained in the `ctx` (instead of being a no-op).

And because of that, `ctx` is always passed explicitly, 
allowing to execute multiple different requests from a single middleware.
:::

### Errors in middlewares

To improve performance, RPC errors in middlewares are monadic, meaning that an RPC error is
considered a valid result.

To check if the call resulted in an error, you can use `isTlRpcError` handler:

```ts
const myMiddleware: RpcCallMiddleware = async (ctx, next) => {
    const res = await next(ctx)

    if (isTlRpcError(res) && res.errorMessage === 'PEER_ID_INVALID') {
        logPeerIdInvalid(ctx.request)
    }

    return res
}
```

You can also use `networkMiddlewares.onRpcError` helper to create a middleware that only handles RPC errors:

```ts
const client = new TelegramClient({
    ...,
    network: {
        middlewares: [
            networkMiddlewares.onRpcError(async (ctx, error) => {
                if (error.errorMessage === 'PEER_ID_INVALID') {
                    logPeerIdInvalid(ctx.request)
                }
            }),
            networkMiddlewares.basic()
        ]
    }
})
```

### Modifying request

In some cases, it might make sense to modify the request before sending.

One way to do so is to overwrite the `ctx` fields:

```ts
const myMiddleware: RpcCallMiddleware = async (ctx, next) => {
    if (ctx.request._ === 'users.getFullUser') {
        ctx.request.id = { _: 'inputUserSelf' }
    }

    return next(ctx)
}
```

Alternatively, you can construct your own context:

```ts
const myMiddleware: RpcCallMiddleware = async (ctx, next) => {
    if (ctx.request._ === 'users.getFullUser') {
        return next({
            manager: ctx.manager,
            params: ctx.params,
            request: {
                _: 'users.getFullUser',
                id: { _: 'inputUserSelf' }
            }
        })
    }

    return next(ctx)
}
```

### Applying middlewares

Once you're done writing your middleware, you need to connect it to the client.
That's done by passing an array to the `middlewares` option, like this:

```ts
const tg = new TelegramClient({
    ...,
    network: {
        middlewares: [
            myMiddleware,
            myOtherMiddleware,
            // You'll probably also want to include all the default 
            // middlewares, as passing this option overrides them.
            ...networkMiddlewares.basic()
        ]
    }
})
```

::: info
**Middleware order matters**, which is why we include the basic middlewares last —
we want `myMiddleware` and `myOtherMiddleware` to also benefit from them
(i.e. have flood waits and internal errors handled)
:::