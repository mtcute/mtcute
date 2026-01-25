import type { ISqliteDatabase, ISqliteStatement } from '@mtcute/core'
import type { DatabaseSyncOptions, SQLInputValue, StatementSync } from 'node:sqlite'
import type { Logger } from '../utils.js'
import { DatabaseSync } from 'node:sqlite'

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

  /** Extra options to pass to `node:sqlite` */
  extra?: DatabaseSyncOptions
}

class WrappedStatement implements ISqliteStatement {
  constructor(
    private stmt: StatementSync,
    private log: Logger,
  ) {}

  run(...params: unknown[]): void {
    this.log.verbose('RUN %s %o', this.stmt.sourceSQL, params)
    this.stmt.run(...(params as SQLInputValue[]))
  }

  get(...params: unknown[]): unknown {
    this.log.verbose('GET %s %o', this.stmt.sourceSQL, params)

    return this.stmt.get(...(params as SQLInputValue[]))
  }

  all(...params: unknown[]): unknown[] {
    this.log.verbose('ALL %s %o', this.stmt.sourceSQL, params)

    return this.stmt.all(...(params as SQLInputValue[])) // .map(replaceBigintsWithNumber)
  }
}

class WrappedDatabase implements ISqliteDatabase {
  constructor(
    private db: DatabaseSync,
    private log: Logger,
  ) {}

  transaction<F extends (...args: any[]) => any>(fn: F): F {
    return ((...args) => {
      const session = this.db.createSession()
      try {
        // eslint-disable-next-line ts/no-unsafe-assignment, ts/no-unsafe-argument
        const res = fn(...args)
        this.db.applyChangeset(session.changeset())
        // eslint-disable-next-line ts/no-unsafe-return
        return res
      } finally {
        session.close()
      }
    }) as F
  }

  prepare<BindParameters extends unknown[]>(sql: string): ISqliteStatement<BindParameters> {
    return new WrappedStatement(this.db.prepare(sql), this.log)
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

  _createDatabase(): ISqliteDatabase {
    // non-int64 mode trims numbers to 32 bits, and we don't want that
    // but int64 mode returns all numbers as bigints, but mtcute expects them
    // as numbers, so we need to convert them... thx deno
    const db = new DatabaseSync(this.filename, this.params?.extra)

    if (!this.params?.disableWal) {
      db.exec('PRAGMA journal_mode = WAL;')
    }

    return new WrappedDatabase(db, this._log)
  }
}
