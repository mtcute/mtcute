# mtcute App Patterns

## Client Setup

Use a platform package:

```ts
import { TelegramClient } from '@mtcute/node'

const tg = new TelegramClient({
  apiId: Number(process.env.API_ID),
  apiHash: process.env.API_HASH!,
  storage: 'account.session',
})
```

For bots:

```ts
await tg.start({ botToken: process.env.BOT_TOKEN })
```

For interactive user login:

```ts
const self = await tg.start({
  phone: () => tg.input('Phone > '),
  code: () => tg.input('Code > '),
  password: () => tg.input('Password > '),
})
```

Use manual auth methods (`sendCode`, `signIn`, `checkPassword`, `importSession`) for headless services where interactive callbacks are inappropriate.

## Storage

Use persisted storage for real apps. In-memory storage loses authorization and cache on restart.

- Node/Bun/Deno string storage: SQLite file.
- Web string storage: IndexedDB database name.
- PostgreSQL: `new PostgresStorage(pool, { schema, account, autoClose })`.
- Session strings can be imported with `await tg.importSession(session)` or `await tg.start({ session })`; treat them like passwords.

## Updates

Disable updates for one-shot scripts:

```ts
const tg = new TelegramClient({ /* ... */, disableUpdates: true })
```

Configure updates when needed:

```ts
const tg = new TelegramClient({
  /* ... */
  updates: { catchUp: true, messageGroupingInterval: 250 },
})
```

Use client emitters for simple handlers:

```ts
tg.onNewMessage.add(async (msg) => {
  try {
    await msg.answerText('ok')
  } catch (e) {
    tg.onError.emit(e)
  }
})
```

Use Dispatcher for bot frameworks and nontrivial routing:

```ts
import { Dispatcher, filters } from '@mtcute/dispatcher'

const dp = Dispatcher.for(tg)

dp.onNewMessage(filters.command('start'), async (msg) => {
  await msg.replyText('Welcome')
})

dp.onCallbackQuery(async (query) => {
  await query.answer({ text: 'Clicked' })
})
```

Common filters include `filters.chat`, `filters.chatId`, `filters.userId`, `filters.command`, `filters.regex`, `filters.media`, `filters.photo`, `filters.video`, `filters.action`, `filters.and`, `filters.or`, and `filters.not`.

## Peers

High-level methods accept `InputPeerLike`: marked numeric IDs, usernames, phone numbers for contacts, `'me'`/`'self'`, raw input peers, and high-level objects.

Prefer already-resolved objects:

```ts
await tg.sendText(msg.sender, 'Hi')
await tg.sendText(msg.sender.inputPeer, 'Hi')
```

Avoid username/phone when a `User` or `Chat` is already present; they may require extra API calls and may be missing.

Use `resolvePeer`, `resolveUser`, or `resolveChannel` for raw API calls.

## Messages, Media, And Text

Text:

```ts
import { html, thtml, md } from '@mtcute/node'

await tg.sendText('me', html`Hello, <b>${name}</b>`)
```

Media:

```ts
import { InputMedia } from '@mtcute/node'

await tg.sendMedia('me', InputMedia.photo('file:assets/photo.jpg', {
  caption: 'Photo',
}))
```

Supported input file forms include `Buffer`, streams, Web `File`, `Response`, uploaded files, `file:path` strings in Node, some URLs, and mtcute/Bot API file IDs. For local file paths in high-level media/file parameters, include the `file:` prefix unless calling `uploadFile({ file: 'path' })`.

Download:

```ts
await tg.downloadToFile('download.jpg', msg.media)
```

`downloadToFile` is Node-only. Use iterable/stream/buffer download methods for portable code.

## Keyboards

```ts
import { BotKeyboard } from '@mtcute/node'

await tg.sendText(chatId, 'Pick:', {
  replyMarkup: BotKeyboard.inline([
    [BotKeyboard.callback('Yes', 'answer:yes')],
    [BotKeyboard.url('Docs', 'https://mtcute.dev')],
  ]),
})
```

For callback data that needs parsing, use `CallbackDataBuilder` and its `.filter()` instead of manual string parsing.

## Errors

```ts
import { tl } from '@mtcute/node'

try {
  await tg.sendText(chatId, 'hello')
} catch (e) {
  if (tl.RpcError.is(e, 'FLOOD_WAIT_%d')) {
    await new Promise(resolve => setTimeout(resolve, e.seconds * 1000))
  } else {
    throw e
  }
}
```

Register `tg.onError.add(...)` for client-level logging. Register `dp.onError(...)` for Dispatcher handler errors.
