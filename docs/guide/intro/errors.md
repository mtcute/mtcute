# Handling errors

> There are two ways to write error-free programs; only the third one works
>
> &copy; Alan J. Perlis

Errors are an inevitable part of any software development, especially
when working with external APIs, and it is important to know how to handle them.

## RPC Errors

Almost any RPC call can result in an RPC error
(like `FLOOD_WAIT_%d`, `CHAT_ID_INVALID`, etc.).

All these RPC errors are instances of `tl.RpcError`.

Sadly, JavaScript does not provide a nice syntax to handle different kinds
of errors, so you will need to write a bit of boilerplate:

```ts
try {
  // your code //
} catch (e) {
  if (tl.RpcError.is(e, 'FLOOD_WAIT_%d')) {
    // handle...
  } else throw e
}
```

::: tip
mtcute automatically handles flood waits smaller than `floodWaitThreshold`
by sleeping for that amount of seconds.
:::

### Unknown errors

Sometimes, Telegram with return an error which is not documented (yet).
In this case, it will still be an `RpcError`, but will have `.unknown = true`

If you are feeling generous and want to help improve the docs for everyone,
you can opt into sending unknown errors to [danog](https://github.com/danog)'s
[error reporting service](https://rpc.pwrtelegram.xyz/).

This is fully anonymous (except maybe IP) and is only used to improve the library
and developer experience for everyone working with MTProto.

To enable, pass `enableErrorReporting: true` to the client options:

```ts
const tg = new TelegramClient({
  ...
  enableErrorReporting: true
})
```

### Errors with parameters

Some errors (like `FLOOD_WAIT_%d`) also contain a parameter.
This parameter is available as error's field (in this case in `.seconds` field) 
after checking for error type using `.is()`:

```ts
try {
  // your code //
} catch (e) {
  if (tl.RpcError.is(e, 'FLOOD_WAIT_%d')) {
    await new Promise((res) => setTimeout(res, e.seconds))
  } else throw e
}
```


## mtcute errors

mtcute has a group of its own errors that are used to indicate
that the provided input is invalid, or that the server
returned something weird.

All these errors are subclassed from `MtcuteError`:

| Name | Description | Package |
|---|---|---|
| `MtArgumentError` | Some argument passed to the method appears to be incorrect in some way | core 
| `MtSecurityError` | Something isn't right with security of the connection | core 
| `MtUnsupportedError` | Server returned something that mtcute does not support (yet). Should not normally happen, and if it does, feel free to [open an issue](https://github.com/mtcute/mtcute/issues/new). | core
| `MtTypeAssertionError`| Server returned some type, but mtcute expected it to be another type. Usually means a bug on mtcute side, so feel free to [open an issue](https://github.com/mtcute/mtcute/issues/new).
| `MtTimeoutError` | Timeout for the request has been reached | core
| `MtPeerNotFoundError` | Only thrown by `resolvePeer`. Means that mtcute wasn't able to find a peer for a given `InputPeerLike`. | client
| `MtMessageNotFoundError` | mtcute hasn't been able to find a message by the given parameters | client
| `MtInvalidPeerTypeError` | mtcute expected another type of peer (e.g. you provided a user, but a channel was expected). | client
| `MtEmptyError` | You tried to access some property that is not available on the object | client

## Client errors

Even though these days internet is much more stable than before,
stuff like "Error: Connection reset" still happens.

Also, there might be some client-level error that happened internally
(e.g. error while processing updates).

You can handle these errors using `TelegramClient#onError`:

```ts
const tg = new TelegramClient(...)

tg.onError.add((err) => {
  console.log(err)
})
```

::: tip
mtcute handles reconnection and stuff automatically, so you don't need to
call `.connect()` again!

This should primarily be used for logging and debugging, as well as some
edge cases where you might need access to low-level connection state
:::

## Dispatcher errors

[Learn more in Dispatcher section](../dispatcher/errors.html).

Unhandled errors that had happened inside dispatcher's handlers
can be handled as well:

```ts
const dp = Dispatcher.child()

dp.onError((error, update, state) => {
  console.log(error)

  // to indicate that the error was handled
  return true
})
```

Dispatcher errors are **local**, meaning that they only trigger
error handler within the current dispatcher, and do not propagate
to parent/children. They also stop propagation within this dispatcher.

If there is no dispatcher error handler, but an error still occurs,
the error is propagated to `TelegramClient` (`conn` will be `undefined`).
