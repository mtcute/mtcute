# Handling errors

We've already briefly touched handling errors
in dispatchers in the Getting Started section,
but let's dive a bit deeper.

## Registering a handler

An error handler for a Dispatcher is simply a function
that is called whenever an error is thrown inside
one of the handlers.

For convenience, that function has access to the error itself,
the parsed update and the [state](./state) (if applicable):

```ts
dp.onNewMessage(
  filters.command('do_stuff'),
  async (msg) => {
    throw new Error('Some error')
  }
)

dp.onError(async (error, update, state) => {
    if (update.name === 'new_message') {
        await update.data.replyText(`Error: ${error.message}`)

        return true
    }

    return false
})
```

Error handler function is expected to return `boolean` indicating whether
the update was handled. If it was not, it will be propagated to Client.

`update` is an object that contains 2 fields: `name` and `data`.

`name` is simply update name (`new_message`, `edit_message`, etc.;
see [Handlers](handlers.html)), and `data` is the respective object.


## What errors are not handled

Errors inside [Raw update handlers](handlers.html#raw-updates) are not handled
by the error handler. Any other errors within the same dispatcher
(both handlers and filters) are handled by it.

## Propagation

### To Client

If the error handler is not registered, throws an error or returns `false`,
the error is propagated to Client's [error handler](../intro/errors.html#client-errors).
Obviously, in Client's error handler you won't have access to the update
that caused this error:

```ts
dp.onNewMessage(
  filters.command('do_stuff'),
  async (msg) => {
    throw new Error('Some error')
  }
)

tg.onError((err) => {
    // will be called since there's no `dp.onError`
    console.log(err)
})
```

### Within the Dispatcher

When an error is thrown by one of the handlers, propagation within this
dispatcher stops (the same way as if it returned `StopPropagation`):

```ts
dp.onNewMessage(
  filters.command('do_stuff'),
  async (msg) => {
    throw new Error('Some error')
  }
)

dp.onNewMessage(
  async (msg) => {
    // will not reach
  }
)
```

### To parent/children

Errors are **not** propagated to parent dispatcher or to any of the children
dispatchers:

```ts
const dp = Dispatcher.for(tg)
const dp1 = Dispatcher.child()
const dp2 = Dispatcher.child()

dp.addChild(dp1)
dp1.addChild(dp2)

// dp --child--> dp1 --child--> dp2

dp.onError(() => console.log('DP caught error'))
dp1.onError(() => console.log('DP1 caught error'))
dp2.onError(() => console.log('DP2 caught error'))

dp1.onNewMessage(() => { throw new Error() })

// Only "DP1 caught error" will ever be printed
```

However, if you need that behaviour, you can use `propagateErrorToParent`:

```ts
const dp = Dispatcher.for(tg)
const dp1 = Dispatcher.child()
const dp2 = Dispatcher.child()

dp.addChild(dp1)
dp1.addChild(dp2)

// dp --child--> dp1 --child--> dp2

dp.onError(() => console.log('DP caught error'))
dp1.onError(() => {
  console.log('DP1 caught error')

  return dp1.propagateErrorToParent(...arguments)
})
dp2.onError(() => console.log('DP2 caught error'))

dp1.onNewMessage(() => { throw new Error() })

// "DP1 caught error" and "DP caught error" will be printed for each new message
```


