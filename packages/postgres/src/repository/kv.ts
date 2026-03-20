import type { IKeyValueRepository } from '@mtcute/core'
import type { PostgresStorageDriver } from '../driver.js'

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
  }

  async set(key: string, value: Uint8Array): Promise<void> {
    await this._driver.client.query(
      `insert into ${this._table} (key, value) values ($1, $2) on conflict (key) do update set value = $2`,
      [key, value],
    )
  }

  async get(key: string): Promise<Uint8Array | null> {
    const res = await this._driver.client.query(`select value from ${this._table} where key = $1`, [key])
    if (!res.rows[0]) return null

    return new Uint8Array(res.rows[0].value)
  }

  async delete(key: string): Promise<void> {
    await this._driver.client.query(`delete from ${this._table} where key = $1`, [key])
  }

  async deleteAll(): Promise<void> {
    await this._driver.client.query(`delete from ${this._table}`)
  }
}
