import { BaseSqliteStorageDriver, ISqliteDatabase } from '@mtcute/core'

import { Database } from '@db/sqlite'

export interface SqliteStorageDriverOptions {
    /**
     * By default, WAL mode is enabled, which
     * significantly improves performance.
     * [Learn more](https://bun.sh/docs/api/sqlite#wal-mode)
     *
     * However, you might encounter some issues,
     * and if you do, you can disable WAL by passing `true`
     *
     * @default  false
     */
    disableWal?: boolean
}

export class SqliteStorageDriver extends BaseSqliteStorageDriver {
    constructor(
        readonly filename = ':memory:',
        readonly params?: SqliteStorageDriverOptions,
    ) {
        super()
    }

    _createDatabase(): ISqliteDatabase {
        const db = new Database(this.filename, {
            int64: true,
        })

        if (!this.params?.disableWal) {
            db.exec('PRAGMA journal_mode = WAL;')
        }

        return db as ISqliteDatabase
    }
}
