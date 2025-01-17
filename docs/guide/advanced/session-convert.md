# Converting sessions

If you're coming from another library, you might already have a session
lying around. 

mtcute provides a way to convert sessions from some other libraries 
to mtcute's format in `@mtcute/convert` package.

::: warning
Please, **only use this to convert your own sessions**.

**DO NOT** use this to convert stolen sessions or sessions you don't own.
Please be a decent person.
:::

## [Telethon v1.x](https://github.com/LonamiWebs/Telethon)

> Telethon v2 seems to have removed the ability to export sessions, 
> so it's currently not supported

```ts
import { convertFromTelethonSession } from '@mtcute/convert'

const client = new TelegramClient({ ... })
await client.importSession(convertFromTelethonSession("..."))
```

## [Pyrogram](https://github.com/pyrogram/pyrogram)

```ts
import { convertFromPyrogramSession } from '@mtcute/convert'

const client = new TelegramClient({ ... })
await client.importSession(convertFromPyrogramSession("..."))
```

## [GramJS](https://github.com/gram-js/gramjs)

```ts
import { convertFromGramjsSession } from '@mtcute/convert'

const client = new TelegramClient({ ... })
await client.importSession(convertFromGramjsSession("..."))
```

### Store session

In some version GramJS added support for storing session as a directory of files,
and can be imported like so:

```ts
import { readGramjsStoreSession, convertFromGramjsSession } from '@mtcute/convert'

const client = new TelegramClient({ ... })
const session = await readGramjsStoreSession('/path/to/session')
await client.importSession(convertFromGramjsSession(session))
```

## [MTKruto](https://github.com/MTKruto/MTKruto)

```ts
import { convertFromMtkrutoSession } from '@mtcute/convert'

const client = new TelegramClient({ ... })
await client.importSession(convertFromMtkrutoSession("..."))
```

## [Telegram Desktop](https://github.com/telegramdesktop/tdesktop) (tdata)

```ts
import { convertFromTdata } from '@mtcute/convert'

const client = new TelegramClient({ ... })
await client.importSession(convertFromTdata({
    path: '/path/to/tdata',
    ignoreVersion: true // note: this might break
    // passcode: '123456' // if you have a passcode
}))
```

## Backwards

If you need to convert a session from mtcute to another library, you can use the `convertTo*` functions instead:

```ts
console.log(convertToTelethonSession(await client.exportSession()))
```

## String-to-string

Once converted, you can use `writeStringSession` to convert the session to a string:

```ts
console.log(writeStringSession(convertFromTelethonSession("...")))
```

## Manual

If your library is not supported, you can still convert the session manually.

In the most simple case, you'll only need `auth_key` and data center information:

```ts
const dc = {
    id: 2,
    ipAddress: '149.154.167.41',
    port: 443,
}

await client.importSession({
    version: 3,
    testMode: false,
    primaryDcs: { main: dc, media: dc },
    authKey: new Uint8Array([ /* ... */ ]),
})
```

### Data center information

If you only know DC ID and not the IP address, you can use the mappings from `@mtcute/convert` to resolve it:

```ts
import { DC_MAPPING_PROD } from '@mtcute/convert'

const dc = DC_MAPPING_PROD[2]
```

If you don't know such information at all, you can just always use the DC 2 (as above), and mtcute will handle the rest

### User information

If you happen to know some information about the user logged in, it might help to provide it as well:

```ts
await client.importSession({
    ...,
    self: {
        userId: 777000,
        isBot: false,
        isPremium: false,
        usernames: [],
    }
})
```
