# @mtcute/sqlite

![](./coverage.svg)

SQLite backed storage for mtcute.

## Usage

```typescript
import { SqliteStorage } from '@mtcute/sqlite'

const tg = new TelegramClient({
    // ...
    storage: new SqliteStorage('client.session')
})
```
