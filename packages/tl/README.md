# @mtcute/tl

> TL schema and related utils used for MTCute.

Generated from TL layer **126** (last updated on 20.03.2021).

## About

This package contains JSON schema, type declarations, binary (de-)serialization, errors, RSA keys and helper functions.

Package patch version is always TL schema layer number, so version `1.0.42` means that this version was generated from
TL layer 42.

- JSON schema, types, binary (de-)serialization and helper functions are generated directly from `.tl` files that are
  automatically fetched from [TDesktop repository](https://github.com/telegramdesktop/tdesktop/).
- Errors are generated
  from [`errors.csv`](https://github.com/LonamiWebs/Telethon/blob/master/telethon_generator/data/errors.csv)
  that is automatically fetched from [Telethon repository](https://github.com/LonamiWebs/Telethon).
- RSA keys info is generated based on manually extracted PEMs from Telegram for Android source code.

## Contents

### `@mtcute/tl`

[Documentation](./modules/index.html)

TypeScript typings and type helpers generated from the schema.

By default, all types are immutable (have their fields marked as `readonly`). That is because most of the time you don't
really need to modify the objects, and modifying them will only lead to confusion. However, there are still valid
use-cases for mutable TL objects, so you can use exported
`tl.Mutable` type to make a given object type mutable.

`tl` is exported as a namespace to allow better code insights, and to avoid cluttering global namespace and very long
import statements.

```typescript
import { tl } from '@mtcute/tl'
const obj: tl.RawInputPeerChat = { _: 'inputPeerChat', chatId: 42 }
console.log(tl.isAnyInputPeer(obj)) // true
```

### `@mtcute/tl/raw-schema`

[Documentation](./modules/raw_schema.html)

JSON file describing all available TL classes, methods and unions. Can be used to write custom code generators
> This very file is used to generate binary serialization and TypeScript typings for `@mtcute/tl`.

```typescript
import * as tlSchema from '@mtcute/tl/raw-schema'
console.log(`Current layer: ${tlSchema.apiLayer}`)
// Current layer: 124
```

### `@mtcute/tl/binary/reader`

[Documentation](./modules/binary_reader.html)

Contains mapping used to read TL objects from binary streams.

```typescript
import readerMap from '@mtcute/tl/binary/reader'
import { BinaryReader } from './binary-reader'

const reader = new BinaryReader(Buffer.from([...]))
console.log(readerMap[0x5bb8e511 /* mt_message */].call(reader))
// { _: 'mt_message', ... }
```

### `@mtcute/tl/binary/writer`

[Documentation](./modules/binary_writer.html)

Contains mapping used to write TL objects to binary streams.

```typescript
import writerMap from '@mtcute/tl/binary/writer'
import { BinaryWriter } from './binary-writer'

const writer = new BinaryWriter()
writerMap[0x5bb8e511 /* mt_message */].call(writer, { ... })
console.log(writer.result())
// Buffer <11 e5 b8 5b ...>
```
