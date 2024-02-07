import { MaybePromise } from '@mtcute/core'
import type { SqliteStorage, SqliteStorageDriver, Statement } from '@mtcute/sqlite'

import { IStateStorageProvider } from '../provider.js'
import { IStateRepository } from '../repository.js'

interface StateDto {
    value: string
    expires_at: number | null
}

interface RateLimitDto {
    reset: number
    remaining: number
}

class SqliteStateRepository implements IStateRepository {
    constructor(readonly _driver: SqliteStorageDriver) {
        _driver.registerMigration('state', 1, (db) => {
            db.exec(`
                create table fsm_state (
                    key text primary key,
                    value text not null,
                    expires_at integer
                );
                create table rl_state (
                    key text primary key,
                    reset integer not null,
                    remaining integer not null
                );
            `)
        })
        _driver.onLoad(() => {
            this._setState = _driver.db.prepare(
                'insert or replace into fsm_state (key, value, expires_at) values (?, ?, ?)',
            )
            this._getState = _driver.db.prepare('select value, expires_at from fsm_state where key = ?')
            this._deleteState = _driver.db.prepare('delete from fsm_state where key = ?')
            this._deleteOldState = _driver.db.prepare('delete from fsm_state where expires_at < ?')

            this._setRl = _driver.db.prepare('insert or replace into rl_state (key, reset, remaining) values (?, ?, ?)')
            this._getRl = _driver.db.prepare('select reset, remaining from rl_state where key = ?')
            this._deleteRl = _driver.db.prepare('delete from rl_state where key = ?')
            this._deleteOldRl = _driver.db.prepare('delete from rl_state where reset < ?')
        })
        _driver.registerLegacyMigration('state', (db) => {
            // not too important information, just drop the table
            db.exec('drop table state')
        })
    }

    private _setState!: Statement
    setState(key: string, state: string, ttl?: number | undefined): MaybePromise<void> {
        this._setState.run(key, state, ttl ? Date.now() + ttl * 1000 : undefined)
    }

    private _getState!: Statement
    getState(key: string, now: number): MaybePromise<string | null> {
        const res_ = this._getState.get(key)
        if (!res_) return null
        const res = res_ as StateDto

        if (res.expires_at && res.expires_at < now) {
            this._deleteState.run(key)

            return null
        }

        return res.value
    }

    private _deleteState!: Statement
    deleteState(key: string): MaybePromise<void> {
        this._deleteState.run(key)
    }

    private _deleteOldState!: Statement
    private _deleteOldRl!: Statement
    vacuum(now: number): MaybePromise<void> {
        this._deleteOldState.run(now)
        this._deleteOldRl.run(now)
    }

    private _setRl!: Statement
    private _getRl!: Statement
    private _deleteRl!: Statement

    getRateLimit(key: string, now: number, limit: number, window: number): [number, number] {
        const val = this._getRl.get(key) as RateLimitDto | undefined

        // hot path. rate limit fsm entries always have an expiration date

        if (!val || val.reset < now) {
            // expired or does not exist
            const item: RateLimitDto = {
                reset: now + window * 1000,
                remaining: limit,
            }

            this._setRl.run(key, item.reset, item.remaining)

            return [item.remaining, item.reset]
        }

        if (val.remaining > 0) {
            val.remaining -= 1

            this._setRl.run(key, val.reset, val.remaining)
        }

        return [val.remaining, val.reset]
    }

    resetRateLimit(key: string): MaybePromise<void> {
        this._deleteRl.run(key)
    }
}

export class SqliteStateStorage implements IStateStorageProvider {
    constructor(readonly driver: SqliteStorageDriver) {}

    static from(provider: SqliteStorage) {
        return new SqliteStateStorage(provider.driver)
    }

    readonly state = new SqliteStateRepository(this.driver)
}
