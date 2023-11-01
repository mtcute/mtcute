# @mtcute/sqlite

📖 [API Reference](https://ref.mtcute.dev/modules/_mtcute_sqlite.html)

SQLite backed storage for mtcute, built with `better-sqlite3`

## Usage

```typescript
import { SqliteStorage } from '@mtcute/sqlite'

const tg = new TelegramClient({
    // ...
    storage: new SqliteStorage('client.session')
})
```
