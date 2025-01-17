# Storage

Storage is a very important aspect of the library,
which should not be overlooked. It is primarily used to
handle caching and authorization (you wouldn't want to
log in every time, right?).

## In-memory storage

The simplest way to store data is to store it in-memory
and never persist it anywhere, and this is exactly
what `MemoryStorage` does.

```ts{4}
import { MemoryStorage } from '@mtcute/core'

const tg = new TelegramClient({
    storage: new MemoryStorage()
})
```

::: warning
It is highly advised that you use some kind of persisted storage!

With in-memory storage, you will need to re-authorize every time
(assuming you don't use [session strings](#session-strings)),
and also caching won't work past a single run.
:::

## SQLite storage

The preferred storage for a Node.js application is the one using SQLite,
because it does not require loading the entire thing into memory, and
is also faster than simply reading/writing a file.

mtcute implements it in a separate package, `@mtcute/sqlite`, and internally
uses [better-sqlite3](https://www.npmjs.com/package/better-sqlite3)

```ts{4}
import { SqliteStorage } from '@mtcute/sqlite'

const tg = new TelegramClient({
    storage: new SqliteStorage('my-account.session')
})
```

::: tip
If you are using `@mtcute/node`, SQLite storage is the default,
and you can simply pass a string with file name instead
of instantiating `SqliteStorage` manually:

```ts
const tg = new TelegramClient({
    storage: 'my-account.session'
})
```
:::

To improve performance, `@mtcute/sqlite` by default uses
WAL mode ([Learn more](https://github.com/JoshuaWise/better-sqlite3/blob/master/docs/performance.md)).

When using WAL, along with your SQLite file there may also
be `-shm` and `-wal` files. If you don't like seeing those files,
instead of disabling WAL altogether, consider putting your storage in a folder
(i.e. `new SqliteStorage('storage/my-account')`).

If you are in fact having problems with WAL mode, you can disable it
with `disableWal` parameter.


## IndexedDB storage

The preferred storage for a Web application is the one using IndexedDB,
which is basically a browser's version of SQLite.

```ts{4}
import { IdbStorage } from '@mtcute/web'

const tg = new TelegramClient({
    storage: new IdbStorage('my-account')
})
```

::: tip
In the browser, IndexedDB storage is the default,
and you can simply pass a string with file name instead
of instantiating `IdbStorage` manually:

```ts
const tg = new TelegramClient({
    storage: 'my-account'
})
```
:::


## Session strings

Sometimes it might be useful to export storage data to a string, and
import it later to another storage. For example, when deploying userbot
applications to a server, where you'll be using another storage.

To generate a session string, simply call `exportSession`:

```ts
await tg.start()
console.log(await tg.exportSession())
```

This will output a fairly long string (about 400 chars) to your console,
which can then be imported:

```ts
const tg = new TelegramClient({...})

await tg.importSession(SESSION_STRING)
// or
await tg.start({ session: SESSION_STRING })
```

You can import session into any storage, including in-memory storage.
This may be useful when deploying to services like [Heroku](https://www.heroku.com),
where their ephemeral file system makes it impossible to use file-based storage.

::: warning
Anyone with this string will be able to authorize as you and do anything.
Treat this as your password, and **never give it away**!

In case you have accidentally leaked this string, make sure to revoke
this session in account settings: "Privacy & Security" > "Active sessions" >
find the one containing "mtcute" > Revoke, or, in case this is a bot,
revoke bot token with [@BotFather](https://t.me/botfather)

Also note that you can't log in with the same session
string from multiple IPs at once, and that would immediately
revoke that session.
:::

::: details What is included?
You might be curious about the information that the session
string includes, and why is it so long.

Most of the string is occupied by 256 bytes long
MTProto authorization key, which, when Base64 encoded,
results in **344** characters. Additionally, information
about user (their ID and whether the user is a bot) and their DC
is included, which results in an average of **407** characters
:::

## Implementing custom storage

The easiest way to implement a custom storage would be to make a subclass of `MemoryStorage`,
or check the [source code of SqliteStorage](https://github.com/mtcute/mtcute/blob/master/packages/sqlite/src/index.ts)
and implement something similar with your DB of choice.

### Architecture

A storage provider in mtcute is composed of:
- **Driver**: the core of the storage, which handles reading and writing data to the storage and implements
  lifecycle methods like `load` and `save`. Driver also manages migrations for the storage, however the migrations 
  themselves are not part of the driver, but are registered separately by repositories
- **Repository**: a set of methods to read and write data of a specific entity to the storage, allowing for
  more efficient and organized access to the data. Repositories are registered in the driver and are used to
  access the data in the storage

Such composable architecture allows for custom storages to implement a specific set of repositories,
and to reuse the same driver for different providers.

In mtcute, these sets of repositories are defined:
- [IMtStorageProvider](https://ref.mtcute.dev/types/_mtcute_core.index.IMtStorageProvider.html), used by `BaseTelegramClient` for low-level
  MTProto data storage
- [ITelegramStorageProvider](https://ref.mtcute.dev/interfaces/_mtcute_core.index.ITelegramStorageProvider.html), used by `TelegramClient` for basic caching
  and update handling operations required for the client to work
- [IStateStorageProvider](https://ref.mtcute.dev/types/_mtcute_dispatcher.IStateStorageProvider.html), used by `Dispatcher` for FSM and Scenes storage
