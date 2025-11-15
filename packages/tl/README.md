# @mtcute/tl

TL schema and related utils used for mtcute.

Generated from TL layer **218** (last updated on 15.11.2025).

## About

This package contains JSON schema, type declarations, binary (de-)serialization, errors, RSA keys and helper functions.

Package's major version is always TL schema layer number,
so version `42.0.0` means that this version was generated from TL layer 42.

- JSON schema, types, binary (de-)serialization and helper functions are generated directly from `.tl` files that are
  automatically fetched from multiple sources and are merged together.
- Errors are generated from
  [`errors.csv`](https://github.com/LonamiWebs/Telethon/blob/master/telethon_generator/data/errors.csv)
  and official Telegram errors JSON file.
- RSA keys info is generated based on manually extracted PEMs from Telegram for Android source code.

## Exports

### Root

TypeScript typings and type helpers generated from the schema.

By default, all types are immutable (have their fields marked as `readonly`). That is because most of the time you don't
really need to modify the objects, and modifying them will only lead to confusion. However, there are still valid
use-cases for mutable TL objects, so you can use exported
`tl.Mutable` helper type to make a given object type mutable.

`tl` is exported as a namespace to allow better code insights,
as well as to avoid cluttering global namespace and very long import statements.

MTProto schema is available in namespace `mtp`, also exported by this package.

```typescript
import { tl } from '@mtcute/tl'
const obj: tl.RawInputPeerChat = { _: 'inputPeerChat', chatId: 42 }
console.log(tl.isAnyInputPeer(obj)) // true
```

RPC errors are also exposed in this package in `tl.errors` namespace:

```typescript
import { tl } from '@mtcute/tl'
try {
    await client.call(...)
} catch (e) {
    if (e instanceof tl.errors.ChatInvalidError) {
        console.log('invalid chat')
    } else throw e
}
```

### `/api-schema.json`

[Documentation](./modules/api_schema.html)

JSON file describing all available TL classes, methods and unions. Can be used to write custom code generators
> This very file is used to generate binary serialization and TypeScript typings for `@mtcute/tl`.

```typescript
import * as tlSchema from '@mtcute/tl/raw-schema.json'

console.log(`Current layer: ${tlSchema.apiLayer}`)
// Current layer: 124
```

### `/binary/reader.js`

Contains mapping used to read TL objects from binary streams.

```typescript
import { __tlReaderMap } from '@mtcute/tl/binary/reader.js'
import { TlBinaryReader } from '@mtcute/tl-runtime'

const reader = TlBinaryReader.manual(new Uint8Array([...]))
console.log(readerMap[0x5bb8e511 /* mt_message */](reader))
// { _: 'mt_message', ... }
```

### `/binary/writer.js`

Contains mapping used to write TL objects to binary streams.

```typescript
import { __tlWriterMap } from '@mtcute/tl/binary/writer'
import { TlBinaryWriter } from '@mtcute/tl-runtime'

const writer = TlBinaryWriter.manual(100)
writerMap[0x5bb8e511 /* mt_message */](writer, { ... })
console.log(writer.result())
// Uint8Array <11 e5 b8 5b ...>
```

### `/binary/rsa-keys.js`

Contains RSA keys used when authorizing with Telegram.

`old` flag also determines if the client should use the old
RSA padding scheme.
