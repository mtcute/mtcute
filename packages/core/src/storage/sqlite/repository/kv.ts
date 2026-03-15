import type { IKeyValueRepository } from '../../repository/key-value.js'

import type { BaseSqliteStorageDriver } from '../driver.js'
import type { ISqliteStatement } from '../types.js'

interface KeyValueDto {
  key: string
  value: Uint8Array
}

export class SqliteKeyValueRepository implements IKeyValueRepository {
  constructor(readonly _driver: BaseSqliteStorageDriver) {
    _driver.registerMigration('kv', 1, (db) => {
      db.exec(`
          create table key_value (
              key text primary key,
              value blob not null
          );
      `)
    })
    _driver.onLoad((db) => {
      this._get = db.prepare('select value from key_value where key = ?')
      this._set = db.prepare('insert or replace into key_value (key, value) values (?, ?)')
      this._del = db.prepare('delete from key_value where key = ?')
      this._delAll = db.prepare('delete from key_value')
    })
  }

  private _set!: ISqliteStatement
  set(key: string, value: Uint8Array): void {
    this._driver._writeLater(this._set, [key, value])
  }

  private _get!: ISqliteStatement
  get(key: string): Uint8Array | null {
    const res = this._get.get(key)
    if (!res) return null

    return (res as KeyValueDto).value
  }

  private _del!: ISqliteStatement
  delete(key: string): void {
    this._del.run(key)
  }

  private _delAll!: ISqliteStatement
  deleteAll(): void {
    this._delAll.run()
  }
}
