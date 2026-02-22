# Custom schema

::: danger
While this *is* a somewhat supported feature/use-case, very limited support is provided
because of the nature of the feature.

When having any problems with the **implementation**, feel free to open an issue.

In all other cases linked to usage of this, but not caused by the implementation itself
(e.g. internal state breaking, storage corruption, missing updates, wrong types, etc.), please deal with it as you see fit.
:::

In some cases it might be viable for you to use a custom schema for your bot,
including but not limited to:

- Using a yet unreleased layer (e.g. taken from [Telegram Android](https://github.com/TGScheme/Schema))
- Using a newer layer before the library is updated to support it
- Using an older layer
- Using undocumented/non-existent constructors (e.g. fuzzing)

## Basics

At the base level, mtcute provides a special `mtcute.customMethod` method that basically forwards
the bytes you pass to the server as-is, without any additional serialization, and return the result as-is too:

```ts
const res = tg.call({ 
  _: 'mtcute.customMethod',
  // `bytes` is the raw TL serialization of the method you want to call
  bytes: new Uint8Array([0xde, 0xad, 0xbe, 0xef])
})
// res is the raw TL serialization of the result
console.log(res)
```

Additionally, there's `overrideLayer` client option that allows you to override the layer number:

```ts
const tg = new TelegramClient({
  ...,
  overrideLayer: 1337
})
```

## Parsing TL schema

However, manually de/serializing everything would be super tedious, 
so you can use `@mtcute/tl-utils` to code-gen everything on demand:

```ts
import { patchRuntimeTlSchema } from '@mtcute/tl-utils'
import { __tlReaderMap, __tlWriterMap } from '@mtcute/node/utils.js'

// here you can pass just the difference between 
// the built-in schema and the custom one
const nextSchema = patchRuntimeTlSchema(`
updateWoof from:Peer = Update;
---functions---
woof.bark at:InputPeer = Bool;
`.trim(), __tlReaderMap, __tlWriterMap)
```
::: tip
`patchRuntimeTlSchema` uses `eval` under the hood, so it might not work in all environments
:::

Once parsed, you can pass `nextSchema` to `TlBinaryReader` and `TlBinaryWriter` to use it:

```ts
import { TlBinaryReader, TlBinaryWriter } from '@mtcute/node/utils.js'

const r = await tg.call({
    _: 'mtcute.customMethod',
    bytes: TlBinaryWriter.serializeObject(nextSchema.writerMap, {
        _: 'woof.bark',
        at: await tg.resolvePeer('teidesu')
    } as any)
})

console.log(TlBinaryReader.deserializeObject(nextSchema.readerMap, r))
```

## Updates

Handling new updates is a bit more involved, since there is no request-response mechanism,
so you will have to hack into the inners of the library.

```ts
const tg = new TelegramClient({
  ...,
  readerMap: nextSchema.readerMap
})

tg.onRawUpdate.add(({ update, peers }) => {
  if (update._ === 'updateWoof') {
    console.log('got woof from %o', peers.get(update.at))
  }
})
```