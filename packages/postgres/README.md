# @mtcute/postgres

PostgreSQL storage provider for mtcute. Uses any `pg`-compatible client (Pool, Client, or PoolClient).

All tables are created in a dedicated schema (`mtcute` by default), with automatic migrations.

## Installation

```bash
pnpm add @mtcute/postgres pg
```

## Usage

```ts
import { TelegramClient } from '@mtcute/node'
import { PostgresStorage } from '@mtcute/postgres'
import pg from 'pg'

const pool = new pg.Pool({ connectionString: 'postgres://localhost/mydb' })

const tg = new TelegramClient({
    apiId: 12345,
    apiHash: 'abcdef',
    storage: new PostgresStorage(pool),
})

const self = await tg.start()
console.log(`logged in as ${self.displayName}`)
```

## Options

```ts
new PostgresStorage(pool, {
    // PostgreSQL schema to use for all tables (default: 'mtcute')
    schema: 'my_schema',
    // Whether to automatically close the client when the storage is destroyed (default: false)
    // Calls .end(), .release(), or .close() depending on what the client supports
    autoClose: true,
    // Account tag for multi-account isolation within the same schema (default: 'default')
    account: 'bot-1',
})
```

## Multi-account

Multiple clients can share the same database and schema by using different `account` tags.
Each account's data is fully isolated from others:

```ts
const pool = new pg.Pool({ connectionString: 'postgres://localhost/mydb' })

const bot1 = new TelegramClient({
    storage: new PostgresStorage(pool, { account: 'bot-1' }),
    // ...
})

const bot2 = new TelegramClient({
    storage: new PostgresStorage(pool, { account: 'bot-2' }),
    // ...
})
```

## Using with PGlite

You can use [PGlite](https://github.com/electric-sql/pglite) for an embedded PostgreSQL instance that requires no external server:

```ts
import { PGlite } from '@electric-sql/pglite'
import { PostgresStorage } from '@mtcute/postgres'

const pglite = await PGlite.create()
const storage = new PostgresStorage(pglite)
```

PGlite satisfies the `PgClient` interface out of the box, so no adapters are needed.

## Using with an existing connection

You can pass any object that satisfies the `PgClient` interface (a `query` method matching `pg`'s signature):

```ts
import { PostgresStorage } from '@mtcute/postgres'

// with a single client
const client = new pg.Client({ connectionString: '...' })
await client.connect()
const storage = new PostgresStorage(client)

// with a pool client
const poolClient = await pool.connect()
const storage = new PostgresStorage(poolClient)
```

> **Note:** By default, mtcute does **not** close the client when the storage is destroyed.
> Set `autoClose: true` if you want the storage to call `.end()`, `.release()`, or `.close()` automatically.

## Database schema

All tables are created under the configured schema (default `mtcute`). The following tables are used:

| Table | Purpose |
|-------|---------|
| `migrations` | Tracks migration versions per repository |
| `auth_keys` | Persistent authorization keys per DC |
| `temp_auth_keys` | Temporary authorization keys with expiry |
| `key_value` | General-purpose key-value store |
| `peers` | Cached peer information (users, chats, channels) |
| `message_refs` | Reference messages for peer access hash resolution |
