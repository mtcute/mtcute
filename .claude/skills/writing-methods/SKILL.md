---
name: writing-methods
description: Use when adding or modifying high-level client methods in packages/core/src/highlevel/methods/. Covers function signatures, codegen annotations, peer resolution, update handling, pagination, and all common patterns.
metadata: 
  internal: true
---

# Writing High-Level Methods

Guide for adding/modifying methods in `packages/core/src/highlevel/methods/`.
Also read the `using-mtcute` skill for more information.

## TL Schema Lookup

Before writing a method, look up the TL constructor(s) you need:

```bash
node .claude/skills/using-mtcute/tools/get-constructor.ts <name>
# e.g. node packages/tl/scripts/get-constructor.ts messages.sendMessage
```

This prints TL definition, TypeScript type, union info, and return type.

## Function Signature Convention

Every exported method function follows this pattern:

```ts
import type { ITelegramClient } from '../../client.types.js'

export async function methodName(
  client: ITelegramClient,       // always first arg
  primaryId: InputPeerLike,      // positional: primary identifiers
  secondaryId: number,           // positional: other required args
  params?: {                     // trailing optional params object
    optionalField?: SomeType
  },
): Promise<ReturnType> { ... }
```

Rules:
- First arg is always `client: ITelegramClient` (stripped by codegen for the class method)
- Primary identifiers (chatId, userId, messageIds) are positional
- Optional/secondary params go in a single trailing `params?` object
- When 3+ required params of similar importance exist, consolidate into a single `params` object (see `editAdminRights`)
- All exports need explicit return types (`isolatedDeclarations: true`)
- Generators use `AsyncIterableIterator<T>` return type

## Codegen Annotations

Files are processed by `packages/core/scripts/generate-client.cjs`. Annotations are `// @annotation` comments on the line before the statement.

### `// @copy`
Copies the import/statement into generated `client.ts`. Used ONLY in `_imports.ts` for shared imports.

```ts
// @copy
import { tl } from '../../tl/index.js'
```

### `// @exported`
Re-exports a type from the generated `methods.ts`. Use for params interfaces and offset types.

```ts
// @exported
export interface DeleteMessagesParams { ... }
```

### `// @available=user|bot|both`
Controls the `**Available**:` JSDoc annotation. If absent, auto-detected from which TL methods are called. Do not add on your own.

### `// @alias=name1,name2`
Creates additional class method aliases.

```ts
// @alias=deleteSupergroup
export async function deleteChannel(...) { ... }
```

### `// @skip`
Excludes from client codegen entirely.

### `// @internal` + `// @noemit`
`@internal` marks as private in generated interface. `@noemit` excludes from `methods.ts` re-export. Combine for internal helpers.

```ts
/**
 * @internal
 * @noemit
 */
export function _findMessageInUpdate(...) { ... }
```

### After adding/modifying methods:
```bash
node packages/core/scripts/generate-client.cjs
```

## Peer Resolution

```ts
import { resolvePeer, resolveUser, resolveChannel } from '../users/resolve-peer.js'

// General peer resolution → tl.TypeInputPeer
const peer = await resolvePeer(client, chatId)

// Type-specific shortcuts
const user = await resolveUser(client, userId)      // → tl.TypeInputUser
const channel = await resolveChannel(client, chatId) // → tl.TypeInputChannel
```

`InputPeerLike` accepts: marked peer ID (number), username (string), `"me"`/`"self"`, TL peer objects, or high-level `User`/`Chat` objects.

### Chat vs Channel dispatch

```ts
import { isInputPeerChannel, toInputChannel } from '../../utils/peer-utils.js'

const peer = await resolvePeer(client, chatId)
if (isInputPeerChannel(peer)) {
  await client.call({ _: 'channels.deleteMessages', channel: toInputChannel(peer), id: ids })
} else {
  await client.call({ _: 'messages.deleteMessages', id: ids, revoke })
}
```

Other peer utilities: `isInputPeerChat`, `isInputPeerUser`, `getMarkedPeerId`, `parseMarkedPeerId`.

For wrong peer type: `throw new MtInvalidPeerTypeError(peerId, 'chat or channel')`.

### Batched queries

```ts
import { _getUsersBatched, _getChatsBatched, _getChannelsBatched } from '../chats/batched-queries.js'

const user = await _getUsersBatched(client, toInputUser(peer))
```

Coalesces multiple individual requests into single `users.getUsers`/`messages.getChats`/`channels.getChannels` calls.

## Update Handling

### Methods returning `tl.TypeUpdates`

```ts
const res = await client.call({ _: 'channels.editAdmin', ... })
client.handleClientUpdate(res)
```

Pass `noDispatch` to suppress update dispatch:
```ts
client.handleClientUpdate(res, true)  // sync PTS only, don't dispatch
```

### Finding messages in update responses

```ts
import { _findMessageInUpdate } from './find-in-update.js'

// For send methods:
const msg = _findMessageInUpdate(client, res, false, !params.shouldDispatch, false, randomId)

// For edit methods (isEdit=true):
const msg = _findMessageInUpdate(client, res, true, !params.shouldDispatch)

// Nullable variant:
const msg = _findMessageInUpdate(client, res, false, !params.shouldDispatch, true)
```

### Methods returning `messages.affectedMessages` / `messages.affectedHistory`

These carry PTS but are not Updates objects. Create a dummy update:

```ts
import { createDummyUpdate } from '../../updates/utils.js'

const res = await client.call({ _: 'channels.deleteMessages', channel, id: ids })
const upd = createDummyUpdate(res.pts, res.ptsCount, peer.channelId)  // channelId for channel-scoped PTS
client.handleClientUpdate(upd)

// For non-channel:
const upd = createDummyUpdate(res.pts, res.ptsCount)
```

### `shouldDispatch` pattern

Methods that return updates typically accept `shouldDispatch?: true` in params. The convention is to NOT dispatch by default (pass `!params.shouldDispatch` to noDispatch):

```ts
client.handleClientUpdate(res, !params.shouldDispatch)
// or for _findMessageInUpdate:
_findMessageInUpdate(client, res, false, !params.shouldDispatch)
```

## Text / Entity Normalization

```ts
import { _normalizeInputText } from '../misc/normalize-text.js'

const [message, entities] = await _normalizeInputText(client, text)
```

`InputText` is `string | { text: string, entities: tl.TypeMessageEntity[] }`. Handles mention entity resolution and whitespace trimming.

## Handling 2FA passwords

Some methods require passing a 2FA password, inside the `InputCheckPasswordSRP` type.
You are expected to add a `password` field to the `params` object, and use it as follows:

```ts
const password = await client.computeSrpParams(
  await client.call({
    _: 'account.getPassword',
  }),
  params.password,
)
```

## Sending Messages

Common send methods use `_processCommonSendParameters` and `_maybeInvokeWithBusinessConnection`:

```ts
import { _processCommonSendParameters, CommonSendParams } from './send-common.js'
import { _maybeInvokeWithBusinessConnection } from './_business-connection.js'
import { randomLong } from '../../../utils/long-utils.js'

const { peer, replyTo, scheduleDate, chainId, quickReplyShortcut } = await _processCommonSendParameters(client, chatId, params)

const randomId = randomLong()
const res = await _maybeInvokeWithBusinessConnection(
  client,
  params.businessConnectionId,
  {
    _: 'messages.sendMessage',
    peer,
    replyTo,
    randomId,
    scheduleDate,
    message,
    entities,
    silent: params.silent,
    clearDraft: params.clearDraft,
    noforwards: params.forbidForwards,
    sendAs: params.sendAs ? await resolvePeer(client, params.sendAs) : undefined,
    quickReplyShortcut,
    effect: params.effect,
    allowPaidFloodskip: params.allowPaidFloodskip,
    allowPaidStars: params.allowPaidMessages,
  },
  { chainId, abortSignal: params.abortSignal },
)
```

### Chain ID for message ordering

```ts
import { _getPeerChainId } from '../misc/chain-id.js'

const chainId = _getPeerChainId(client, peer, 'send')
await client.call(request, { chainId })
```

## File / Media Normalization

```ts
// InputFileLike → tl.TypeInputFile (triggers upload if needed)
const file = await client._normalizeInputFile(input, params)

// InputMediaLike → tl.TypeInputMedia
const media = await client._normalizeInputMedia(media, params)
```

## Pagination

### Offset-based with `ArrayPaginated`

```ts
import { makeArrayPaginated, ArrayPaginated } from '../../utils/index.js'

// @exported
export interface GetHistoryOffset { id: number; date: number }

export async function getHistory(
  client: ITelegramClient,
  chatId: InputPeerLike,
  params?: { limit?: number; offset?: GetHistoryOffset },
): Promise<ArrayPaginated<Message, GetHistoryOffset>> {
  // ...fetch and parse...
  const last = msgs[msgs.length - 1]
  const next = last ? { id: last.id, date: last.raw.date } : undefined
  return makeArrayPaginated(msgs, res.count ?? msgs.length, next)
}
```

`ArrayPaginated<T, Offset>` extends `Array<T>` with `.next` (next offset or `undefined`) and `.total`.

### Iterator wrapper over paginated getter

```ts
export async function* iterHistory(
  client: ITelegramClient,
  chatId: InputPeerLike,
  params?: Parameters<typeof getHistory>[2] & {
    limit?: number      // default Infinity
    chunkSize?: number  // default 100
  },
): AsyncIterableIterator<Message> {
  const peer = await resolvePeer(client, chatId)  // resolve once
  let { offset } = params ?? {}
  let current = 0

  for (;;) {
    const res = await getHistory(client, peer, {
      offset,
      limit: Math.min(chunkSize, limit - current),
    })
    for (const msg of res) {
      yield msg
      if (++current >= limit) return
    }
    if (!res.next) return
    offset = res.next
  }
}
```

### `ArrayWithTotal` for non-paginated responses with count

```ts
import { makeArrayWithTotal } from '../../utils/index.js'
return makeArrayWithTotal(items, total)
```

## Return Types

Wrap raw TL objects in high-level classes:

```ts
import { Message, PeersIndex } from '../../types/index.js'

// Build peer index from response
const peers = PeersIndex.from(res)

// Single message
return new Message(res.message, peers)

// Array
return res.users.map(u => new User(u))

// Nullable
return res ? new Chat(res) : null

// Filter empties
const msgs = res.messages.filter(m => m._ !== 'messageEmpty').map(m => new Message(m, peers))
```

## Error Handling

```ts
import { MtArgumentError } from '../../../types/errors.js'
import { MtTypeAssertionError } from '../../../types/errors.js'
import { MtInvalidPeerTypeError } from '../../types/errors.js'
import { MtMessageNotFoundError } from '../../types/errors.js'
import { assertTypeIs, assertTypeIsNot } from '../../../utils/type-assertions.js'

// Type assertions on TL responses
assertTypeIsNot('getHistory', res, 'messages.messagesNotModified')
assertTypeIs('getFullUser', res.fullUser, 'userFull')

// Argument validation
throw new MtArgumentError('mustReply used, but replyTo was not passed')

// Peer type mismatch
throw new MtInvalidPeerTypeError(chatId, 'channel')
```

## Common Utilities

```ts
import { randomLong } from '../../../utils/long-utils.js'
import { normalizeDate, normalizeMessageId } from '../../utils/index.js'
import { getMarkedPeerId, parseMarkedPeerId } from '../../../utils/peer-utils.js'
import { inputPeerToPeer } from '../../utils/peer-utils.js'
import { Long } from 'long'
```

- `randomLong()` — random `Long` for `randomId` fields
- `normalizeDate(d)` — `Date | number | undefined` → UNIX seconds
- `normalizeMessageId(m)` — `number | Message | undefined` → `number | undefined`
- `Long.ZERO` — for `hash` fields (from `long` package)

## TL Flag Mapping

Optional boolean TL flags → optional params:
```ts
{
  _: 'messages.sendMessage',
  noWebpage: params.disableWebPreview,    // undefined = flag not set
  silent: params.silent,
  clearDraft: params.clearDraft,
  noforwards: params.forbidForwards,
}
```

Optional peer params with ternary:
```ts
sendAs: params.sendAs ? await resolvePeer(client, params.sendAs) : undefined,
```

Destructure defaults at top:
```ts
const { limit = 100, offset = 0 } = params ?? {}
```

## File Organization

- Public methods: named after the action (`send-text.ts`, `get-history.ts`, `delete-messages.ts`)
- Internal helpers: prefixed `_`, annotated `@internal @noemit` (`_processCommonSendParameters`, `_findMessageInUpdate`)
- Shared params interfaces: exported with `// @exported` from the relevant file
- Normalizers: prefixed `_normalize*` (`_normalizeInputText`, `_normalizeInputMedia`)
- Utility files: `_utils.ts` or `_business-connection.ts` etc.
- Tests: colocated as `*.test.ts`
