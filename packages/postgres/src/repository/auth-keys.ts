import type { IAuthKeysRepository } from '@mtcute/core'
import type { PostgresStorageDriver } from '../driver.js'

export class PostgresAuthKeysRepository implements IAuthKeysRepository {
  private _authKeys: string
  private _tempAuthKeys: string

  constructor(readonly _driver: PostgresStorageDriver) {
    this._authKeys = _driver.tableName('auth_keys')
    this._tempAuthKeys = _driver.tableName('temp_auth_keys')

    _driver.registerMigration('auth_keys', 1, async (client) => {
      await client.query(`
        create table if not exists ${this._authKeys} (
            dc integer primary key,
            key bytea not null
        );
        create table if not exists ${this._tempAuthKeys} (
            dc integer not null,
            idx integer not null,
            key bytea not null,
            expires integer not null,
            primary key (dc, idx)
        );
      `)
    })
  }

  async set(dc: number, key: Uint8Array | null): Promise<void> {
    if (!key) {
      await this._driver.client.query(`delete from ${this._authKeys} where dc = $1`, [dc])

      return
    }

    await this._driver.client.query(
      `insert into ${this._authKeys} (dc, key) values ($1, $2) on conflict (dc) do update set key = $2`,
      [dc, key],
    )
  }

  async get(dc: number): Promise<Uint8Array | null> {
    const res = await this._driver.client.query(`select key from ${this._authKeys} where dc = $1`, [dc])
    if (!res.rows[0]) return null

    return new Uint8Array(res.rows[0].key)
  }

  async setTemp(dc: number, idx: number, key: Uint8Array | null, expires: number): Promise<void> {
    if (!key) {
      await this._driver.client.query(
        `delete from ${this._tempAuthKeys} where dc = $1 and idx = $2`,
        [dc, idx],
      )

      return
    }

    await this._driver.client.query(
      `insert into ${this._tempAuthKeys} (dc, idx, key, expires) values ($1, $2, $3, $4)
       on conflict (dc, idx) do update set key = $3, expires = $4`,
      [dc, idx, key, expires],
    )
  }

  async getTemp(dc: number, idx: number, now: number): Promise<Uint8Array | null> {
    const res = await this._driver.client.query(
      `select key from ${this._tempAuthKeys} where dc = $1 and idx = $2 and expires > $3`,
      [dc, idx, now],
    )
    if (!res.rows[0]) return null

    return new Uint8Array(res.rows[0].key)
  }

  async deleteByDc(dc: number): Promise<void> {
    await this._driver.client.query(`delete from ${this._authKeys} where dc = $1`, [dc])
    await this._driver.client.query(`delete from ${this._tempAuthKeys} where dc = $1`, [dc])
  }

  async deleteAll(): Promise<void> {
    await this._driver.client.query(`delete from ${this._authKeys}`)
    await this._driver.client.query(`delete from ${this._tempAuthKeys}`)
  }
}
