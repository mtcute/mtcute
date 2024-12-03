import type { BindParameters, Database as TDatabase, Statement as TStatement } from '@db/sqlite'
import type { ISqliteDatabase, ISqliteStatement } from '@mtcute/core'
import type { Logger } from '../utils.js'

import { BaseSqliteStorageDriver } from '@mtcute/core'

let Database: typeof import('@db/sqlite').Database

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

function replaceBigintsWithNumber(obj?: object): object | undefined {
    if (!obj) return obj

    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'bigint') {
            (obj as any)[key] = Number(value)
        }
    }

    return obj
}

class WrappedStatement implements ISqliteStatement {
    constructor(
        private stmt: TStatement,
        private sql: string,
        private log: Logger,
    ) {}

    run(...params: unknown[]): void {
        this.log.verbose('RUN %s %o', this.sql, params)
        this.stmt.run(...(params as BindParameters[]))
    }

    get(...params: unknown[]): unknown {
        this.log.verbose('GET %s %o', this.sql, params)

        return replaceBigintsWithNumber(this.stmt.get(...(params as BindParameters[])))
    }

    all(...params: unknown[]): unknown[] {
        this.log.verbose('ALL %s %o', this.sql, params)

        return this.stmt.all(...(params as BindParameters[])).map(replaceBigintsWithNumber)
    }
}

class WrappedDatabase implements ISqliteDatabase {
    constructor(
        private db: TDatabase,
        private log: Logger,
    ) {}

    transaction(fn: any): any {
        return this.db.transaction(fn)
    }

    prepare<BindParameters extends unknown[]>(sql: string): ISqliteStatement<BindParameters> {
        return new WrappedStatement(this.db.prepare(sql), sql, this.log)
    }

    exec(sql: string): void {
        this.db.exec(sql)
    }

    close(): void {
        this.db.close()
    }
}

export class SqliteStorageDriver extends BaseSqliteStorageDriver {
    constructor(
        readonly filename = ':memory:',
        readonly params?: SqliteStorageDriverOptions | undefined,
    ) {
        super()
    }

    async _load(): Promise<void> {
        if (!Database) {
            // we load this lazily to avoid loading ffi if it's not needed,
            // in case the user doesn't use sqlite storage
            Database = (await import('@db/sqlite')).Database
        }
        await super._load()
    }

    _createDatabase(): ISqliteDatabase {
        // non-int64 mode trims numbers to 32 bits, and we don't want that
        // but int64 mode returns all numbers as bigints, but mtcute expects them
        // as numbers, so we need to convert them... thx deno
        const db = new Database(this.filename, { int64: true })

        if (!this.params?.disableWal) {
            db.exec('PRAGMA journal_mode = WAL;')
        }

        return new WrappedDatabase(db, this._log)
    }
}
