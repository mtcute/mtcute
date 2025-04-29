# Middlewares

Dispatcher provides basic middleware functionality. It is not as extensible
as middlewares in frameworks likes [Telegraf](https://github.com/telegraf/telegraf),
and that is by design, since we already have filters and propagation using which
you can achieve pretty much the same.

Middlewares are only called for parsed updates.

## Middleware types

Dispatcher supports 2 middlewares: pre-update and post-update.

### Pre-update

**Pre-update** middleware is called right before an update is going
to be dispatched, and can be used to skip that update altogether.

```ts
dp.onPreUpdate((upd) => {
  // randomly skip 10% of updates
  if (Math.random() < 0.1)
    return PropagationAction.Stop
})
```

### Post-update

**Post-update** middleware is called after an update was processed
by the dispatcher. Whether the update was handled is also provided here:

```ts
dp.onPostUpdate((handled, upd) => {
  if (handled) {
    console.log(`handled ${upd.name}`)
  }
})
```

## Additional context

You can add some additional context in the pre-update middleware,
and that context will also be available in post-update middleware
and error handler:

```ts
interface TimerContext {
  start: number
}

dp.onPreUpdate<TimerContext>((upd) => {
  upd.start = performance.now()
})

dp.onPostUpdate<TimerContext>((handled, upd) => {
  if (handled) {
    console.log(`handled ${upd.name} in ${performance.now() - upd.start} ms`)
  }
})

dp.onError<TimerContext>((err, upd) => {
  console.log(`error for ${upd.name} after ${performance.now() - upd.start} ms`)
})
```

Note that *currently* you can't access that context from handlers or filters
(see [mtcute#4](https://github.com/mtcute/mtcute/issues/4)).
