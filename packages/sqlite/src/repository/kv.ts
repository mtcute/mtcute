import { Statement } from 'better-sqlite3'

import { IKeyValueRepository } from '@mtcute/core'

import { SqliteStorageDriver } from '../driver.js'

interface KeyValueDto {
    key: string
    value: Uint8Array
}

export class SqliteKeyValueRepository implements IKeyValueRepository {
    constructor(readonly _driver: SqliteStorageDriver) {
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

    private _set!: Statement
    set(key: string, value: Uint8Array): void {
        this._driver._writeLater(this._set, [key, value])
    }

    private _get!: Statement
    get(key: string): Uint8Array | null {
        const res = this._get.get(key)
        if (!res) return null

        return (res as KeyValueDto).value
    }

    private _del!: Statement
    delete(key: string): void {
        this._del.run(key)
    }

    private _delAll!: Statement
    deleteAll(): void {
        this._delAll.run()
    }
}
