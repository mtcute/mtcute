import { Database } from 'bun:sqlite'
import type { ISqliteDatabase } from '@mtcute/core'
import { BaseSqliteStorageDriver } from '@mtcute/core'

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
        readonly params?: SqliteStorageDriverOptions | undefined,
    ) {
        super()
    }

    _createDatabase(): ISqliteDatabase {
        const db = new Database(this.filename)

        if (!this.params?.disableWal) {
            db.exec('PRAGMA journal_mode = WAL;')
        }

        return db as ISqliteDatabase
    }
}
