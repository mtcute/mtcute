# Groups and propagation

When you register multiple handlers with conflicting filters,
only the one registered the first will be executed, to avoid
handling the same update twice.

This is sometimes undesirable, and to handle these you can use
either [handler groups](#groups), or [propagation symbols](#propagation)

::: tip
You can also use a [child Dispatcher](children.html). In this page, however,
it is assumed that all handlers are registered to one dispatcher.
:::

## Groups

Your first option to handle the same update multiple times is by
using a separate handler group.

Handler groups are identified with a single number (group `0` is the
default group) and are processed within the same dispatcher one-by-one
in order (`..., -2, -1, 0, 1, 2, ...`).

For example, consider the following code

```ts
dp.onNewMessage(
  filters.or(filters.text, filters.sticker),
  async (msg) => {
    console.log('Text or sticker')
  }
)

dp.onNewMessage(
  filters.text,
  async (msg) => {
    console.log('Text only')
  }
)
```

In this code, the second handler will never be executed, because
the first one handles `text` messages as well.

To make the Dispatcher execute the second handler, you can
register it to a different group:

```ts
dp.onNewMessage(
  filters.text,
  async (msg) => {
    console.log('Text only')
  },
  1
)
```

In this case, this handler will be executed *after* the first one.
Alternatively, you can pass a negative number to make the second
handler execute *before* the first one:

```ts
dp.onNewMessage(
  filters.text,
  async (msg) => {
    console.log('Text only')
  },
  -1
)
```

Group can also be set using `addUpdateHandler`:

```ts
dp.addUpdateHandler({ ... }, 1)
```

## Propagation

To customize the behaviour even further, you can use propagation symbols
that `@mtcute/dispatcher` exports in `PropagationAction` enum.

### Stop propagation

To prevent the update from being handled by any other handlers
within the same dispatcher, you can use `PropagationAction.Stop`:

```ts
dp.onNewMessage(
  filters.or(filters.text, filters.sticker),
  async (msg) => {
    console.log('Text or sticker')

    return PropagationAction.Stop
  }
)

dp.onNewMessage(
  filters.text,
  async (msg) => {
    console.log('Text only')
  },
  1
)
```

In the above code, second handler *will not* be executed even though it is
in a separate group.

This will not, however, prevent the handlers from a
[child Dispatcher](children.html) to be executed.

### Stop children propagation

A bit ahead of ourselves, since we haven't covered child
Dispatchers yet, but the idea is pretty simple.

`PropagationAction.StopChidlren` is very similar to the previous one, but also
prevents the handlers from child dispatchers to be executed:

```ts
dp.onNewMessage(
  filters.or(filters.text, filters.sticker),
  async (msg) => {
    console.log('Text or sticker')

    return PropagationAction.StopChidlren
  }
)

const dp1 = Dispatcher.child()
dp.addChild(dp1)

dp1.onNewMessage(
  filters.text,
  async (msg) => {
    console.log('Text only')
  }
)
```

In the above code, second executor will not be called, even though
it is in a child dispatcher.

### Continue propagation

As an alternative to [groups](#groups), you can use `PropagationAction.Continue`
symbol. It makes the dispatcher continue propagating this update within
the same group even though some handler from that group was already executed:

```ts
dp.onNewMessage(
  filters.or(filters.text, filters.sticker),
  async (msg) => {
    console.log('Text or sticker')

    return PropagationAction.Continue
  }
)

dp.onNewMessage(
  filters.text,
  async (msg) => {
    console.log('Text only')
  }
)
```

In the above code, the second dispatcher will be called for text messages
even though the first one also matches them.

Note that `Continue` only works within the same handler group.

## Raw updates

As mentioned earlier, raw updates are handled independently of parsed
updates, and they have their own groups and propagation chain.

This means that in the following example both handlers will be called,
despite returning `Stop` action:

```ts
dp.onNewMessage(() => {
  return PropagationAction.Stop
})

dp.onRawUpdate(
  (cl, upd) => upd._ === 'updateNewMessage',
  () => { ... }
)
```
