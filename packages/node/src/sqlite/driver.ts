import type { Options } from 'better-sqlite3'
import sqlite3 from 'better-sqlite3'
import type { ISqliteDatabase } from '@mtcute/core'
import { BaseSqliteStorageDriver } from '@mtcute/core'

export interface SqliteStorageDriverOptions {
    /**
     * By default, WAL mode is enabled, which
     * significantly improves performance.
     * [Learn more](https://github.com/JoshuaWise/better-sqlite3/blob/master/docs/performance.md)
     *
     * However, you might encounter some issues,
     * and if you do, you can disable WAL by passing `true`
     *
     * @default  false
     */
    disableWal?: boolean

    /**
     * Additional options to pass to `better-sqlite3`
     */
    options?: Options
}

export class SqliteStorageDriver extends BaseSqliteStorageDriver {
    constructor(
        readonly filename = ':memory:',
        readonly params?: SqliteStorageDriverOptions | undefined,
    ) {
        super()
    }

    _createDatabase(): ISqliteDatabase {
        const db = sqlite3(this.filename, {
            ...this.params?.options,
            verbose: this._log.mgr.level >= 5 ? (this._log.verbose as Options['verbose']) : undefined,
        })

        if (!this.params?.disableWal) {
            db.pragma('journal_mode = WAL')
        }

        return db as ISqliteDatabase
    }
}
