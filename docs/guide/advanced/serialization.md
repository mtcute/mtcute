# Object serialization

In some cases it might be necessary to manually serialize the objects you receive from the server
to store them somewhere and be able to recreate the original object later.

There are a few possible solutions for this, and it depends on your use case.

## Temporary storage

If you need the serialization temporarily (e.g. to pass around between processes),
and you are sure that the receiving side will use the same mtcute version,
you can simply do:

```ts
import {
    serializeObject,
    serializePeersIndex,
    deserializeObject,
    deserializePeersIndex,
} from '@mtcute/core/utils.js'

// we'll use a Message for this example, 
// the process is similar for other objects
declare const obj: Message // e.g. from dp.onNewMessage

// Message object consists of tl.TypeMessage and a PeersIndex.
// not all objects use a PeersIndex, 
// but those that do will need one to be serialized separately.
const serializedObj = serializeObject(obj.raw)
const serializedPeers = serializePeersIndex(obj._peers)

// on the receiving side
const message = deserializeObject(serializedObj)
assert(tl.isAnyMessage(message))
const peers = deserializePeersIndex(serializedPeers)
const message = new Message(message, peers)
```

::: tip
The same `PeersIndex` might be reused across multiple objects, so you might want to
manually store the peers separately instead of storing everything for each object
:::

## Persistent storage

If you need to store the serialization for a longer period of time,
e.g. in a database for future access, you can use `deserializeObjectWithCompat` instead.
It works pretty much the same on the surface, but will also deserialize objects that were serialized
with older versions of the library:

```ts
import {
    serializeObject,
    serializePeersIndex,
    deserializeObjectWithCompat,
    deserializePeersIndexWithCompat,
} from '@mtcute/core/utils.js'

declare const obj: Message

const serializedObj = serializeObject(obj.raw)
const serializedPeers = serializePeersIndex(obj._peers)

// on the receiving side
const message = deserializeObjectWithCompat(serializedObj)
assert(tl.isAnyMessage(message))
const peers = deserializePeersIndexWithCompat(serializedPeers)
const message = new Message(message, peers)
```

::: warning Limitations
`deserializeObjectWithCompat` doesn't support *every single object* in the schema, nor *every single layer*,
because that way the bundle size would be huge.

Objects that most commonly require persistent storage are supported, however,
and if you find something missing for your use-case feel free to [open an issue](https://github.com/mtcute/mtcute/issues/new)

For the complete list of supported objects, please see [TYPES_FOR_COMPAT](https://github.com/mtcute/mtcute/blob/master/packages/tl/scripts/constants.ts)
or [compat.tl](https://github.com/mtcute/mtcute/blob/master/packages/tl/data/compat.tl)
:::