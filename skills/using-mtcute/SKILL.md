---
name: using-mtcute
description: Use when working with mtcute, @mtcute/* packages, Telegram MTProto in TypeScript, TL types, Telegram API methods, or building Telegram bots/clients/userbots with mtcute. Trigger for tasks involving TelegramClient, Dispatcher, filters, raw TL API calls, mtcute storage, sessions, media/files, keyboards, parse modes, or mtcute API lookup. Do not use for Bot API wrapper libraries such as grammy, telegraf, or node-telegram-bot-api unless the task is migrating from them to mtcute.
---

# using mtcute

## Core Rule

Treat mtcute as a TypeScript MTProto library, not a Bot API wrapper. Prefer high-level `TelegramClient` methods first, then raw TL `.call()` only when there is no high-level method.

Use the platform package for the target runtime:

```ts
import { TelegramClient } from '@mtcute/node'
```

Do not import `TelegramClient` from `@mtcute/core` in normal apps; platform packages preconfigure runtime crypto, storage, transport, and file helpers.

## Workflow

1. Identify the runtime and install/import the right package:
   - Node.js: `@mtcute/node`
   - Bun: `@mtcute/bun`
   - Deno: `jsr:@mtcute/deno`
   - Browser: `@mtcute/web`
   - Update routing: add `@mtcute/dispatcher`
   - PostgreSQL storage: add `@mtcute/postgres` and `pg` or PGlite
2. Search the current project before writing code. Reuse existing client construction, storage names, dispatcher setup, env handling, and logging patterns.
3. Use the bundled lookup scripts in this skill directory to inspect the installed/generated API when method names, options, or TL types are uncertain.
4. Read only the relevant reference file:
   - `references/app-patterns.md` for clients, auth, storage, updates, dispatcher, errors, and common implementation patterns.
   - `references/api-lookup.md` for high-level method lookup, raw TL calls, and TypeDoc/reference navigation.
5. Verify with the project’s TypeScript/test commands when code changes are made.

## Minimal Bot

```ts
import { Dispatcher, filters } from '@mtcute/dispatcher'
import { TelegramClient } from '@mtcute/node'

const tg = new TelegramClient({
  apiId: Number(process.env.API_ID),
  apiHash: process.env.API_HASH!,
  storage: 'bot.session',
})

const dp = Dispatcher.for(tg)

dp.onNewMessage(filters.command('start'), async (msg) => {
  await msg.replyText('Hello from mtcute')
})

await tg.start({ botToken: process.env.BOT_TOKEN })
```

## Method And Type Lookup

Resolve bundled scripts relative to this `SKILL.md` file, not relative to the user's project. In examples below, replace `<skill-dir>` with the absolute path to the directory containing this `SKILL.md`.

```bash
node <skill-dir>/scripts/get-method.js sendText
node <skill-dir>/scripts/get-method.js --search forum
node <skill-dir>/scripts/get-class.js Message
node <skill-dir>/scripts/get-constructor.js --with-references messages.sendMessage
```

Run these commands from the project or app root so the scripts can resolve local `node_modules` or the mtcute monorepo workspace. Use these scripts before guessing signatures. They read the installed `@mtcute/*` packages or this monorepo workspace and support fuzzy matching.

## Key Practices

- Keep secrets in environment variables: `API_ID`, `API_HASH`, `BOT_TOKEN`, session strings.
- Use persisted storage for real apps. String storage names map to runtime defaults: SQLite in Node/Bun/Deno, IndexedDB in web.
- Pass `InputPeerLike` values directly to high-level methods: `'me'`, usernames, marked IDs, `User`, `Chat`, `Message`, or input peers.
- Prefer `Chat`, `User`, `Message`, or `.inputPeer` over username/phone when a peer object is already available.
- Use `@mtcute/dispatcher` for bots with update routing, filters, middleware, scenes, state, or callback handling.
- Use `html`, `thtml`, or `md` tagged templates for formatted text instead of manually building entities unless the task requires raw entities.
- Use `InputMedia` and `BotKeyboard` builders for media and keyboards.
- For raw TL calls, read `node_modules/@mtcute/core/tl/index.d.ts` or use `get-constructor.js`; handle returned `Updates` with `tg.handleClientUpdate(...)` when needed.
- Handle `tl.RpcError.is(e, 'FLOOD_WAIT_%d')` and other RPC errors explicitly when user-facing behavior matters.

## Source Material

Local docs are in `docs/guide`. Hosted docs and API reference:

- Guide: `https://mtcute.dev/guide/`
- API reference: `https://ref.mtcute.dev/`
- LLM index: `https://mtcute.dev/llms.txt`

Prefer local docs in this repository when available because they match the source checkout. Use the hosted TypeDoc reference for exact public API pages or when working outside this repo.
