---
name: update-layer
description: Use when updating TL schema layer in mtcute, fetching new Telegram API schemas, or when user asks to update the layer/schema
---

# Update TL Layer

Update the Telegram TL schema by fetching from multiple sources, resolving conflicts, and generating code.

## Workflow

> Avoid wasting time and effort on reading the scripts to understand how they work, everything you need is listed below.

### 1. Dry run

```bash
cd packages/tl && pnpm tsx scripts/fetch-api.ts --dry-run
```

Parse the output. It contains:

- **SCHEMAS** - available sources and their layers
- **LAYER** - the final layer number
- **CONFLICTS** - entries needing manual resolution (with numbered options)
- **DOCS** - whether cached documentation is available
- **VERSION** - current version and suggested bump

### 2. Resolve and run

Build flags from the dry-run output:

```bash
pnpm tsx scripts/fetch-api.ts \
  --resolve entryName=N \    # 0=remove, 1+ = pick option from dry-run. repeat per conflict
  --docs cached|fresh \      # use cached docs if available, or force re-fetch
  --bump                     # or --no-bump
```

You should pass `--docs fresh` when one of the Core/Corefork/Blogfork schemas was updated, but the cached docs are still on an older layer.

In most cases you should pass `--bump`, except when running again within the same run (e.g. to fix int53 types).

### 3. Process diff

```bash
pnpm tsx scripts/process-diff.ts
```

### 4. Check int53 overrides
This prints a structured summary of changes: added/removed/modified classes and methods, and a list of `long` fields that may need int53 overrides.
Check if they represent user/channel/chat IDs or file sizes — those should be `int53`

If there are such `long` fields listed, present them to the user and run the `scripts/add-int53-overrides.ts` script to add the override to the file like so:
```bash
# ! key is the entry name, array items are the fields that need to be overridden
echo '{"class":{"user":["bot_id"],"channel":["linked_id"]},"method":{"messages.getHistory":["offset_id"]}}' | pnpm tsx scripts/add-int53-overrides.ts
```

Verify that there were no `[warn]` messages regarding the overrides you just added.

### 5. Generate code

```bash
pnpm tsx scripts/gen-code.ts
```

### 6. Update compat layer

If constructors changed ID or were removed, update `packages/core/src/utils/binary/compat.ts`:
- Add new `case` entries in `mapCompatObject` and type-specific mappers for old constructor names (e.g. `user_layer225`)
- Map old fields to new structure, filling in defaults for new required fields
- If a constructor was removed, try to find the closest replacement, whenever possible

### 7. Update high-level types

Based on the diff, update these files for new/changed TL types:

**New message actions:** Add interfaces + switch cases in `packages/core/src/highlevel/types/messages/message-action.ts` (`_messageActionFromTl`). Also add new types to the `MessageAction` union.

**New chat event actions:** Add interfaces + switch cases in `packages/core/src/highlevel/types/peers/chat-event/actions.ts` (`_actionFromTl`). Also add new types to the `ChatAction` union.

**New message fields:** Update `packages/core/src/highlevel/types/messages/message.ts` (the `Message` class).

**New user/chat fields:** Update as needed:
- `packages/core/src/highlevel/types/peers/user.ts` (`User` class, wraps `user` type)
- `packages/core/src/highlevel/types/peers/full-user.ts` (`FullUser` class, wraps `userFull` type)
- `packages/core/src/highlevel/types/peers/chat.ts` (`Chat` class, wraps `chat`, `chatForbidden`, `channel`, `channelForbidden` types)
- `packages/core/src/highlevel/types/peers/full-chat.ts` (`FullChat` class, wraps `chatFull` and `channelFull` types)

### 8. Other follow-ups

**Message-related updates:** If `Update`-related types changed (including `messageAction*`, `messageMedia*`, `messageReply*Header`, `messageForwardHeader`, `messageEntity*`), update `_fetchMissingPeers` in the updates manager to handle new fields.

**Peer-related updates:** If `user` or `channel` changed, update `service/peers.ts` min-updating logic for new fields.

### 9. Verify

```bash
# typecheck and fix any type errors
pnpm run -w lint:tsc

# run eslint, fix any remaining linting issues
pnpm run -w lint:ci --fix

# run tests
pnpm run -w test
```

### 10. Summary

- Present the summary of changes in the schema to the user
- Present your changes in the code to the user