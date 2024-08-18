# @mtcute/convert

📖 [API Reference](https://ref.mtcute.dev/modules/_mtcute_convert.html)

This package can be used to convert other libraries sessions to/from mtcute sessions

Currently only the libraries that support exporting sessions to strings are supported, namely:

## [Telethon](https://github.com/LonamiWebs/Telethon)

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

## [MTKruto](https://github.com/MTKruto/MTKruto)

```ts
import { convertFromMtkrutoSession } from '@mtcute/convert'

const client = new TelegramClient({ ... })
await client.importSession(convertFromMtkrutoSession("..."))
```
