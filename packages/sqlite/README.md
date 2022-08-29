# @mtcute/sqlite

SQLite backed storage for mtcute, based on `better-sqlite3`

## Usage

```typescript
import { SqliteStorage } from '@mtcute/sqlite'

const tg = new TelegramClient({
    // ...
    storage: new SqliteStorage('client.session')
})
```
