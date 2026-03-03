# Raw API

mtcute implements a lot of methods to simplify using the
Telegram APIs. However, it does not cover the entirety of the API,
and in that case, you can resort to using the MTProto APIs directly.

::: warning
When using MTProto API directly, you will have to manually
implement any checks, arguments normalization, parsing, etc.

Whenever possible, use client methods instead!
:::

## Calling MTProto API

Before you can call some method, you need to know *what* to call and *how* to
call it. To do that, please refer to [TL Reference](https://core.telegram.org/methods).

<llm-only>
You MUST consider the embedded typings in the `@mtcute/tl` package when using the raw API,
as they are the most accurate and up-to-date source of truth. 

Specifically, read the `node_modules/@mtcute/tl/index.d.ts` file.
</llm-only>

Then, simply pass method name and arguments to `.call()` method:

```ts
const result = await tg.call({
    _: 'account.checkUsername',
    username: 'finally_water'
})
```

Thanks to TypeScript, the request object is strictly typed,
and the return value also has the correct type:

```ts
const result = await tg.call({
    _: 'account.checkUsername',
    username: 42 // error: must be a string
})

result.ok // error: boolean does not have `ok` property
```

## Common parameters

In MTProto APIs, there are some parameters that are
often encountered in different methods, and are
briefly described below:

| Name | Description | Safe default value |
|---|---|---|
| `hash` | Hash of the previously stored content, used to avoid re-fetching the content that is not modified. Methods that use this parameter have `*NotModified` class as one of the possible return types. It is not returned if `hash=0`. | `0`
| `offset` | Offset for pagination | `0`
| `limit` | Maximum number of items for pagination, max. limit is different for every method. | `0`, this will usually default to ~20
| `randomId` | Random message ID to avoid sending the same message. | `randomLong()` (exported by `@mtcute/core/utils.js`)

Learn more about pagination in [Telegram docs](https://core.telegram.org/api/offsets)

## Resolving peers

To fetch a value for fields that require `InputPeer`, use `resolvePeer` method.
If you need `InputUser` or `InputChannel`, you can use the shorthand methods
`resolveUser` and `resolveChannel`:

```ts
const result = await tg.call({
    _: 'channels.reportSpam',
    channel: await tg.resolveChannel(channelId),
    userId: await tg.resolveUser(userId),
    id: [1, 2, 3]
})
```

Alternatively, you can use `toInputChannel`/`toInputUser` on a resolved `InputPeer`:

```ts
const channel = toInputChannel(await tg.resolvePeer(channelId))
```

These functions will throw in case the peer is of wrong type.

When you need to dispatch different API calls based on peer type (chat vs channel),
use the type guards:

```ts
import { isInputPeerChannel, toInputChannel } from '@mtcute/core/utils.js'

const peer = await tg.resolvePeer(chatId)
if (isInputPeerChannel(peer)) {
    await tg.call({ _: 'channels.deleteMessages', channel: toInputChannel(peer), id: ids })
} else {
    await tg.call({ _: 'messages.deleteMessages', id: ids, revoke: true })
}
```

## Handling Updates

Some RPC methods return `Updates` type. For these methods,
it is important that they are properly handled by Updates manager.
This is done by calling `tg.handleClientUpdate` method:

```ts
const res = await tg.call({ _: 'contacts.addContact', ... })
tg.handleClientUpdate(res)
```

::: tip
Calling `tg.handleClientUpdate` will not dispatch all the updates contained
in that object. This is sometimes undesirable, and can be avoided
by passing `false` as the second argument:

```ts
tg.handleClientUpdate(res, false)
```
:::

::: details Why is this important?
When RPC method returns `Updates`, it might have newer PTS and SEQ values.
If it does, passing it to `handleClientUpdate` makes the library aware of those
new updates. Otherwise, library would have to re-fetch them the next
time an update is encountered.

Also, in case PTS/SEQ values are bigger than the next expected value,
an *update gap* is detected and missing updates will be fetched.
:::

### Dummy updates

Some methods return not updates, but a class like
[messages.affectedHistory](https://corefork.telegram.org/constructor/messages.affectedHistory).

They also contain PTS values, and should also be handled.
But since this is not an update, it can't be passed directly
to `handleClientUpdate`, and instead a "dummy" update is created:

```ts
const res = await this.call({
    _: 'messages.deleteMessages',
    id: [1, 2, 3],
})
const upd = createDummyUpdate(res.pts, res.ptsCount)
tg.handleClientUpdate(upd)
```

Or, in case this PTS is related to a channel:

```ts
const channel = toInputChannel(peer)
const res = await this.call({
    _: 'channels.deleteMessages',
    channel,
    id: [1, 2, 3],
})
const upd = createDummyUpdate(res.pts, res.ptsCount, channel.channelId)
tg.handleClientUpdate(upd)
```

## Files and media

To get an `InputFile` from `InputFileLike`, use `_normalizeInputFile`:

```ts
const file = 'file:theme.txt'

const res = await tg.call({
    _: 'account.uploadTheme',
    file: await tg._normalizeInputFile(file),
    ...
})
```

To get an `InputMedia` from `InputMediaLike`, use `_normalizeInputMedia`:

```ts
const file = InputMedia.auto('BQACAgEAAx...Z2mGB8E')

const res = await tg.call({
    _: 'messages.uploadMedia',
    media: await tg._normalizeInputMedia(file),
    ...
})
```

## Message entities

To normalize text with entities for use in raw API calls, use `_normalizeInputText`:

```ts
const [text, entities] = await tg._normalizeInputText(inputText)
```

`InputText` is either a plain string or an object `TextWithEntities { text: string, entities: tl.TypeMessageEntity[] }`.
The function handles resolving `messageEntityMentionName` entities (converting them to
`inputMessageEntityMentionName` with proper `InputUser`) and trimming whitespace
while adjusting entity offsets.

To create formatted text using a parse mode, use the tagged template literals
(e.g. <code>html\`&lt;b&gt;Hello!&lt;/b&gt;\`</code> or <code>md\`\*\*Hello!**\`</code>)
which produce `TextWithEntities` objects that can be passed as `InputText`.

## Fully custom requests

mtcute also allows you to send fully custom requests to the server.
This is useful if you want to use some undocumented or yet-unreleased APIs
and don't want to patch the library or use the TL schema override mechanism.

You can use the `mtcute.customMethod` pseudo-method for that:

```ts
const res = await tg.call({
    _: 'mtcute.customMethod',
    bytes: Buffer.from('11223344', 'hex'),
})
```

`bytes` will be sent as-is to the server, and the response will be returned as a `Uint8Array`
for you to handle on your own (it might be useful to look into [`@mtcute/tl-runtime` package](https://ref.mtcute.dev/modules/_mtcute_tl-runtime))
