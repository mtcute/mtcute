---
name: using-mtcute
description: >
  Use when working with mtcute, @mtcute/* packages, Telegram MTProto in TypeScript,
  TL types, Telegram API methods, or building Telegram bots/clients in TypeScript.
  Not for Bot API wrapper libraries (grammy, telegraf, node-telegram-bot-api).
allowed-tools: Bash(node */.claude/skills/using-mtcute/tools/*)
---

# mtcute — TypeScript MTProto Library

## What is mtcute?

mtcute is a modern, type-safe TypeScript library for Telegram's **MTProto** protocol. Unlike Bot API wrappers (grammy, telegraf, node-telegram-bot-api), mtcute speaks Telegram's native binary protocol directly, giving access to the **full** Telegram API — not just the bot subset.

## Architecture overview

Core packages (you likely won't use these directly):
- @mtcute/core: MTProto client, high-level methods, TL schema, types
- @mtcute/html-parser: HTML ↔ Telegram entities
- @mtcute/markdown-parser: Markdown ↔ Telegram entities
- @mtcute/file-id: Bot API file_id parsing

Platform packages (use the one that matches your target platform):
- @mtcute/node, @mtcute/bun, @mtcute/deno: Runtime bindings for server-side JavaScript
- @mtcute/web: Browser bindings (IndexedDB, WebCrypto, WebSocket)

Extra packages (only use these for the specific functionality they cover):
- @mtcute/dispatcher: Update routing, filters, bot framework
- @mtcute/convert: Importing sessions from other libraries
- @mtcute/test: Helpers for unit tests

Always install and import everything from the **platform package**, not from `@mtcute/core`:

```typescript
// ✅ Correct — platform package pre-configures crypto, transport, storage
import { TelegramClient } from '@mtcute/node'

// ❌ Wrong — raw core client requires manual platform setup
import { TelegramClient } from '@mtcute/core'
```

## Basic usage

### Creating a client

```typescript
import { TelegramClient } from '@mtcute/node'

const tg = new TelegramClient({
  apiId: Number(process.env.API_ID),
  apiHash: process.env.API_HASH,
  storage: 'my-account', // SQLite file name (Node.js)
})
```

### Client lifecycle

When you create a `TelegramClient`, it starts in the `disconnected` state.

In most cases, you will want to use the `start` method to connect and authenticate:

```typescript
// Bot login
const self = await tg.start({ botToken: process.env.BOT_TOKEN })

// User login (interactive)
const self = await tg.start({
  phone: () => input('Phone: '),
  code: () => input('Code: '),
  password: () => input('2FA password: '),
})
```

However in some cases you may want to manually control the lifecycle:

```typescript
// Manually connect
await tg.connect()

// Manually disconnect
await tg.disconnect()

// Disconnect and destroy the instance
await tg.destroy()
```

### Calling high-level methods

The `TelegramClient` class has 300+ high-level convenience methods. Some of the most commonly used ones are listed below:
- **messages**: `sendText`, `sendMedia`, `getHistory`, `editMessage`, `deleteMessages`, `forwardMessages`, `searchMessages`, ...
- **chats**: `getChat`, `getChatMember`, `banChatMember`, `setChatTitle`, `setChatPhoto`, ...
- **users**: `getUsers`, `getMe`, `setMyProfilePhoto`, ...
- **files**: `downloadFile`, `uploadFile`, `downloadAsStream`, ...
- **dialogs**: `getDialogs`, `getPeerDialogs`, ...
- **bots**: `answerInlineQuery`, `answerCallbackQuery`, `setMyCommands`, ...
- **forums**: `createForumTopic`, `editForumTopic`, ...
- **stickers**: `getStickerSet`, `createStickerSet`, ...
- **stories**: `sendStory`, `getStories`, ...
- **auth**: `start`, `logOut`, `sendCode`, ...
- **password**: `enable2fa`, `change2fa`, ...

```typescript
// Send a text message
await tg.sendText('me', 'Hello!')

// Send with formatting
await tg.sendText(chatId, html`Hello, <b>${name}</b>!`)

// Send media
await tg.sendMedia(chatId, {
  type: 'photo',
  file: 'file:./photo.jpg', // note the file: prefix!
  caption: 'Check this out',
})

// Get chat info
const chat = await tg.getChat('username')

// Download file
await tg.downloadToFile('path/to/save.jpg', photo)
```

Some methods have "batch" counterparts that accept arrays instead of single arguments:

```typescript
const durov = await tg.getUser('durov')
const [durov, telegram] = await tg.getUsers(['durov', 'telegram'])

// Similarly with `getChat` and `getChats`, `getPeer` and `getPeers`
```

Avoid mixing those up. If the method name is plural, it most likely returns and/or accepts arrays, keep that in mind.

### Peer resolution

High-level methods in mtcute accept `InputPeerLike` for chat/user arguments, which can be:
- Numeric ID: `123456789`
- Username string: `'username'`
- `'me'` / `'self'` for the current user
- A `tl.TypeInputPeer` object 
- A high-level object (`User`, `Chat`, `Message`, etc.)

### Handling updates with Dispatcher

```typescript
import { Dispatcher, filters } from '@mtcute/dispatcher'

const dp = Dispatcher.for(tg)

dp.onNewMessage(filters.chat('private'), async (msg) => {
  await msg.replyText('Hello!')
})

dp.onNewMessage(filters.command('start'), async (msg) => {
  await msg.replyText('Welcome!')
})

dp.onCallbackQuery(filters.dataPrefix('btn_'), async (query) => {
  await query.answer({ text: 'Clicked!' })
})

// Start receiving updates
await tg.startUpdatesLoop()
```

### Raw TL method calls

For methods not wrapped by high-level API, use `.call()`:

```typescript
const result = await tg.call({
  _: 'messages.getEmojiKeywords',
  langCode: 'en',
})
// result is fully typed based on the method's return type
```

## TL type system

mtcute generates TypeScript types from Telegram's TL schema. All types live under the `tl` namespace:

```typescript
import { tl } from '@mtcute/core'
```

| TL concept | TypeScript name | Example |
|---|---|---|
| Object `user` | `tl.RawUser` | `{ _: 'user', id: number, ... }` |
| Namespaced object `messages.chats` | `tl.messages.RawChats` | |
| Method `users.getUsers` | `tl.users.RawGetUsersRequest` | |
| Union type | `tl.TypeUser` | `tl.RawUser \| tl.RawUserEmpty` |

Every TL object has a `_` discriminant field with its constructor name (e.g., `_: 'user'`).

Type guards are available: `tl.isAnyPeer()`, `tl.isAnyMessage()`, etc.

The full TL schema is available as JSON at `@mtcute/node/tl/api-schema.json` (or any platform package). Format:
```jsonc
{
  "l": 223, // layer number
  "e": [ // array of TL entries
    {
      "kind": "class" | "method",
      "name": "user",
      "id": 826896937, // constructor ID
      "type": "User", // return/union type
      "arguments": [{
        "name": "id",
        "type": "int53", // base type name (union or primitive)
        "typeModifiers"?: {
          "predicate"?: "flags.0", // conditional field, e.g. "flags.3"
          "isVector"?: true, // optional: when true, type is actually Vector<type>
        }
      }, ...],
      "comment": "..."
    },
    ...
  ],
  "u": { "User": "..." } // union comments
}
```

When `typeModifiers.predicate` is set (e.g. `"flags.3"`), the field is optional and only present when bit 3 of the `flags` field is set. When `isVector` is true, the actual type is `Vector<type>`.

## Looking up types and method signatures

Three bundled tools read from the installed `@mtcute/*` packages in `node_modules`. All support fuzzy matching and auto-correct typos.

**When to use which:**
- Need a raw TL type/method definition or its TS interface → `get-constructor`
- Need a high-level client method signature (params, return type, JSDoc) → `get-method`
- Need a high-level wrapper class/interface definition (Message, Chat, etc.) → `get-class`
- Need the TL parameters a raw API call expects → `get-constructor --with-references`
- Not sure which method/class to use → `get-method --search` or `get-class --search`

### get-constructor: TL schema lookup

Shows TL definition, TypeScript type, union membership, and return type.

```bash
node .claude/skills/using-mtcute/tools/get-constructor.js <name>
node .claude/skills/using-mtcute/tools/get-constructor.js --with-references <name>
```

Accepts any of these input formats:
- TL names: `user`, `messages.sendMessage`
- TS type names: `RawUser`, `TypeInputUser`, `tl.messages.RawChats`, `messages.RawGetHistoryRequest`

Use `--with-references` when you need to understand the types referenced by a constructor's arguments or return type — it appends all referenced constructors/unions to the output.

### get-method: high-level client method lookup

Shows the full JSDoc + method signature from `TelegramClient`.

```bash
node .claude/skills/using-mtcute/tools/get-method.js <method-name>
node .claude/skills/using-mtcute/tools/get-method.js --search <keyword>
node .claude/skills/using-mtcute/tools/get-method.js --list
```

- Default mode: exact/fuzzy match on method name, falls back to substring in names then descriptions
- `--search`: search in both method names and descriptions, lists all matches
- `--list`: print all available methods with one-line descriptions

### get-class: high-level type/class lookup

Shows the full class/interface/type definition with all members from `highlevel/types/`.

```bash
node .claude/skills/using-mtcute/tools/get-class.js <name>
node .claude/skills/using-mtcute/tools/get-class.js --no-members <name>
node .claude/skills/using-mtcute/tools/get-class.js --search <keyword>
node .claude/skills/using-mtcute/tools/get-class.js --list
```

- Default mode: exact/fuzzy match on export name, shows full definition with all members
- `--no-members`: only show the declaration line + JSDoc, not the body
- `--search`: search in both names and descriptions, lists all matches (e.g., `--search keyboard`)
- `--list`: print all available exports with one-line descriptions

## High-level types

mtcute wraps raw TL objects in convenient classes with helper methods:

- `Message` — wraps `tl.RawMessage`, has `.replyText()`, `.editText()`, `.delete()`, `.forward()`, etc.
- `Chat` — wraps channel/group/user chat info
- `User` — wraps `tl.RawUser`
- `Document`, `Photo`, `Video`, `Audio`, `Voice`, `Sticker` — media types
- `InlineQuery`, `CallbackQuery`, `ChatJoinRequest` — update types

These are in `node_modules/@mtcute/core/dist/highlevel/types/`.

## Text formatting

mtcute supports tagged template literals for formatting:

```typescript
import { html, md } from '@mtcute/node'

await tg.sendText(chat, html`<b>Bold</b> and <i>italic</i>`)
await tg.sendText(chat, md`**Bold** and *italic*`)
```

The `html` and `md` tags handle escaping automatically when interpolating variables.

## Common patterns

### Error handling

```typescript
import { tl } from '@mtcute/node'

try {
  await tg.sendText(chatId, 'hello')
} catch (e) {
  if (tl.RpcError.is(e, 'FLOOD_WAIT_%d')) {
    console.log(`Rate limited, wait ${e.seconds}s`)
  }
}
```

### Sending media

```typescript
import { InputMedia } from '@mtcute/node'

// Upload from path (note the file: prefix!)
await tg.sendMedia(chatId, InputMedia.document('file:/path/to/file.pdf', {
  fileName: 'report.pdf',
}))

// Upload from buffer/stream
await tg.sendMedia(chatId, InputMedia.photo(buffer))

// Upload from URL
await tg.sendMedia(chatId, InputMedia.photo('https://example.com/image.jpg'))
```

### Keyboards

```typescript
import { BotKeyboard } from '@mtcute/node'

// Inline keyboard
await tg.sendText(chatId, 'Pick one:', {
  replyMarkup: BotKeyboard.inline([
    [BotKeyboard.callback('Yes', 'btn_yes'), BotKeyboard.callback('No', 'btn_no')],
    [BotKeyboard.url('Docs', 'https://mtcute.dev')],
  ]),
})

// Reply keyboard
await tg.sendText(chatId, 'Choose:', {
  replyMarkup: BotKeyboard.reply([
    [BotKeyboard.text('Option A'), BotKeyboard.text('Option B')],
  ]),
})
```

### Pagination / iteration

Many methods have an `iter*` counterpart returning `AsyncIterableIterator`:

```typescript
// Iterate over chat history
for await (const msg of tg.iterHistory(chatId, { chunkSize: 100 })) {
  console.log(msg.text)
}

// Iterate over search results
for await (const msg of tg.iterSearchMessages({ query: 'hello', chatId })) {
  console.log(msg.id)
}

// Non-iter methods return paginated results with a `.next` cursor
const page = await tg.getHistory(chatId, { limit: 50 })
const nextPage = await tg.getHistory(chatId, { limit: 50, offset: page.next })
```

### Client events

The client exposes `Emitter` instances for connection lifecycle and errors. Subscribe with `.add()`, unsubscribe with `.remove()`:

```typescript
// Connection state: 'offline' | 'connecting' | 'updating' | 'connected'
// 'updating' means connected but catching up on missed updates
tg.onConnectionState.add((state) => {
  console.log('Connection:', state)
})

// Unhandled errors (if no listener, errors are logged to console)
tg.onError.add((err) => {
  console.error('Error:', err)
})

// Raw TL updates (before dispatcher processing)
tg.onRawUpdate.add((update) => { ... })
```

### Proxy / custom transport (Node.js)

```typescript
import { TelegramClient } from '@mtcute/node'
import {
  HttpProxyTcpTransport,
  SocksProxyTcpTransport,
  MtProxyTcpTransport,
  proxyTransportFromUrl,
} from '@mtcute/node'

const tg = new TelegramClient({
  // or parse from URL (socks4/5, http, https, mtproto):
  transport: proxyTransportFromUrl('socks5://user:pass@1.2.3.4:1080'),
})
```

## Further reading

Full documentation and LLM-friendly reference: https://mtcute.dev/llms.txt.
When Context7 MCP is available, prefer using it instead of manually fetching the docs. Library ID is `/mtcute/mtcute`.