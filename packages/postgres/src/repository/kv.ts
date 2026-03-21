import type { IKeyValueRepository } from '@mtcute/core'
import type { PostgresStorageDriver } from '../driver.js'

interface KeyValueDto {
  key: string
  value: Uint8Array
}

export class PostgresKeyValueRepository implements IKeyValueRepository {
  private _table: string

  constructor(readonly _driver: PostgresStorageDriver) {
    this._table = _driver.tableName('key_value')

    _driver.registerMigration('kv', 1, async (client) => {
      await client.query(`
        create table if not exists ${this._table} (
            key text primary key,
            value bytea not null
        );
      `)
    })

    _driver.registerMigration('kv', 2, async (client) => {
      await client.query(`alter table ${this._table} add column account text not null default 'default'`)
      await client.query(`alter table ${this._table} drop constraint key_value_pkey`)
      await client.query(`alter table ${this._table} add primary key (account, key)`)
    })
  }

  private get _account(): string {
    return this._driver.account
  }

  async set(key: string, value: Uint8Array): Promise<void> {
    await this._driver.client.query(
      `insert into ${this._table} (account, key, value) values ($1, $2, $3)
       on conflict (account, key) do update set value = $3`,
      [this._account, key, value],
    )
  }

  async get(key: string): Promise<Uint8Array | null> {
    const res = await this._driver.client.query<KeyValueDto>(
      `select value from ${this._table} where account = $1 and key = $2`,
      [this._account, key],
    )
    if (!res.rows[0]) return null

    return new Uint8Array(res.rows[0].value)
  }

  async delete(key: string): Promise<void> {
    await this._driver.client.query(
      `delete from ${this._table} where account = $1 and key = $2`,
      [this._account, key],
    )
  }

  async deleteAll(): Promise<void> {
    await this._driver.client.query(`delete from ${this._table} where account = $1`, [this._account])
  }
}
