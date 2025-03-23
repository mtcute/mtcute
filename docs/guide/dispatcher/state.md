# State

Finite State Machine (**FSM** for short, or simply **State**) is a commonly used concept
when developing bots that allows the bot to "remember" its state,
which in turn makes the bot more interactive and user-friendly.

<!-- Full code example with FSM: TODO LINK -->

::: tip
FSM is even more useful when used with [Scenes](scenes.html)
:::

## Setup

Dispatcher natively supports FSM. To set it up, simply pass
a [storage](#storage) to the constructor:

```ts
interface BotState { ... }

const dp = Dispatcher.for<BotState>(tg, {
  storage: new MemoryStateStorage()
})
// or, for children
const dp = Dispatcher.child<BotState>()
```

You **must** provide some state type in order to use FSM (in the example above,
`BotState`). You *can* use `any`, but this is not recommended.

Then, the update state argument will be available in every handler
that supports FSM (that is: `new_message`, `edit_message`, `message_group`, `callback_query`)
as well as to their filters:

```ts
dp.onNewMessage(async (msg, state) => {
  // ...
})
```

::: warning
Type parameter for `Dispatcher` (in this case, `BotState`) is only
used as a *hint* for the compiler.

It is not checked at runtime.
:::

## Getting current state

To retrieve the current state, use `state.get`:

```ts
dp.onNewMessage(async (msg, state) => {
  const current = await state.get()
})
```

By default, if there's no state stored, `null` is returned.
However, you can provide the default fallback state,
which will be used instead:

```ts
dp.onNewMessage(async (msg, state) => {
  const current = await state.get({ ... })
  // or a function
  const current = await state.get(() => ({ ... }))
})
```

## Updating state

To update the state, use `state.set`:

```ts
dp.onNewMessage(async (msg, state) => {
  await state.set({ ... })
})
```

You can also set a TTL, after which the newly set state
will be considered "stale" and removed:

```ts
dp.onNewMessage(async (msg, state) => {
  // ttl = 1 hour
  await state.set({ ... }, 3600)
})
```

You can also modify the existing state by only
providing the modification (under the hood, the library will
fetch the current state automatically):

```ts
dp.onNewMessage(async (msg, state) => {
  await state.merge({ ... })
})
```

If the state can be empty, make sure to pass the default state,
otherwise an error will be thrown:

```ts
dp.onNewMessage(async (msg, state) => {
  await state.merge({ ... }, defaultState)
})
```

## Removing state

To remove currently stored state, use `state.delete`:

```ts
dp.onNewMessage(async (msg, state) => {
  await state.delete()
})
```

## Related filters

As mentioned above, state (and its type!) is also available to the filters,
so you can make [custom filters](filters.html#custom-filters) that use it:

```ts
dp.onNewMessage(
  (msg, state) => state.get().then((res) => res?.action === 'ENTER_PASSWORD'),
  async (msg, state) => {
    // ...
  }
)
```

However, the above isn't very clean, so the library provides `filters.state`:

```ts
dp.onNewMessage(
  filters.state((state) => state.action === 'ENTER_PASSWORD'),
  async (msg, state: UpdateState<ActionEnterPassword>) => {
    const current = await state.get()
    // or, if you have strict null checks
    const current = (await state.get())!
  }
)
```

Note that here we explicitly pass inner type, because due to TypeScript
limitations, we can't automatically derive state type from the predicate.

`filters.state` *does not* match empty state, instead,
use `filters.stateEmpty`:

```ts
dp.onNewMessage(
  filters.stateEmpty,
  async (msg, state) => {
    // ...
  }
)
```

## Keying

FSM may look like magic, but in fact it is not. Under the hood,
user's state is stored in the [storage](#storage), and the key is derived
from the update object.

By default, `defaultStateKeyDelegate` is used, which derives
the key as follows:
- If private chat, `msg.chat.id`
- If group chat, `msg.chat.id + '_' + msg.sender.id`
- If channel, `msg.chat.id`
- If callback query from a non-inline message:
    - If in private chat (i.e. `upd.chatType === 'user'`), `upd.user.id`
    - If in group/channel/supergroup (i.e. `upd.chatType !== 'user'`),
      `upd.chatId + '_' + upd.user.id`

This is meant to be a pretty opinionated default, but you can use custom
keying mechanism too, if you want:

```ts
const customKey = (upd) => ...

const dp = Dispatcher.for<BotState>(tg, { storage, key: customKey })
// or, locally for a child dispatcher:
const dp = Dispatcher.child<BotState>({ key: customKey })
```


## Getting state from outside

In some cases, you may need to access the state (and maybe even alter it)
outside of handlers, in the handler that does not support state, or using a different key.

You can do so by using `.getState`:

```ts
const state = await dp.getState(await msg.getReply())
// you can also pass User/Chat instances:
const state = await dp.getState(msg.sender)
// and then, for example
await state.delete()
```

When providing an object, dispatcher will use its own keying
mechanism(s). You can provide a key manually to avoid that:

```ts
const target = msg.getReply()
const state = dp.getState(defaultStateKeyDelegate(target))
// or even manually
const state = await dp.getState(`${target.chat.id}`)
```

You can also provide a totally custom key
to store arbitrary data:

```ts
// tip: prefix the key with $ and then something unique
// to avoid clashing with FSM and Scenes
const state = await dp.getState<UserPref>(`$internal-user-pref:${userId}`)
```

::: warning
`getState` **DOES NOT** guarantee type of the state,
because it can not determine the origin of state key.

By default, it uses dispatcher's state type, but you can also
override this with type parameter:

```ts
const state = await dp.getState<SomeInternalState>(...)
```
:::

## Storage

Storage is the backend used by Dispatcher to store state related information.
A storage is a class that implements [`IStateStorageProvider`](https://ref.mtcute.dev/types/_mtcute_dispatcher.IStateStorageProvider).

```ts
const dp = Dispatcher.for<BotState>(tg, { storage: new MemoryStorage() })
// or, locally for a child dispatcher:
const dp = Dispatcher.child<BotState>({ storage: new MemoryStorage() })
```

### SQLite storage

You can re-use your existing SQLite storage for FSM:

```ts
import { SqliteStorage } from '@mtcute/sqlite'
import { SqliteStateStorage } from '@mtcute/dispatcher'

const storage = new SqliteStorage('my-account')
const tg = new TelegramClient({ ..., storage })

const dp = Dispatcher.for<BotState>(tg, { 
  storage: SqliteStateStorage.from(storage)
})
```

Alternatively, you can create a new SQLite storage specifically for FSM:

```ts
import { SqliteStorageDriver } from '@mtcute/sqlite'
import { SqliteStateStorage } from '@mtcute/dispatcher'

const dp = Dispatcher.for<BotState>(tg, { 
  storage: new SqliteStateStorage(new SqliteStorageDriver('my-state'))
})
```