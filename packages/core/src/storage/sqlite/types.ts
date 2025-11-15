/**
 * An abstract interface for a SQLite database.
 *
 * Roughly based on `better-sqlite3`'s `Database` class,
 * (which can be used as-is), but only with the methods
 * that are used by mtcute.
 */
export interface ISqliteDatabase {
  transaction: <F extends (...args: any[]) => any>(fn: F) => F

  prepare: <BindParameters extends unknown[]>(sql: string) => ISqliteStatement<BindParameters>

  exec: (sql: string) => void
  close: () => void
}

export interface ISqliteStatement<BindParameters extends unknown[] = unknown[]> {
  run: (...params: BindParameters) => void
  get: (...params: BindParameters) => unknown
  all: (...params: BindParameters) => unknown[]
}
