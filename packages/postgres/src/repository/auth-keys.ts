import type { IAuthKeysRepository } from '@mtcute/core'
import type { PostgresStorageDriver } from '../driver.js'

interface AuthKeyDto {
  dc: number
  key: Uint8Array
}

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
      `)
      await client.query(`
        create table if not exists ${this._tempAuthKeys} (
            dc integer not null,
            idx integer not null,
            key bytea not null,
            expires integer not null,
            primary key (dc, idx)
        );
      `)
    })

    _driver.registerMigration('auth_keys', 2, async (client) => {
      await client.query(`alter table ${this._authKeys} add column account text not null default 'default'`)
      await client.query(`alter table ${this._authKeys} drop constraint auth_keys_pkey`)
      await client.query(`alter table ${this._authKeys} add primary key (account, dc)`)

      await client.query(`alter table ${this._tempAuthKeys} add column account text not null default 'default'`)
      await client.query(`alter table ${this._tempAuthKeys} drop constraint temp_auth_keys_pkey`)
      await client.query(`alter table ${this._tempAuthKeys} add primary key (account, dc, idx)`)
    })
  }

  private get _account(): string {
    return this._driver.account
  }

  async set(dc: number, key: Uint8Array | null): Promise<void> {
    if (!key) {
      await this._driver.client.query(
        `delete from ${this._authKeys} where account = $1 and dc = $2`,
        [this._account, dc],
      )

      return
    }

    await this._driver.client.query(
      `insert into ${this._authKeys} (account, dc, key) values ($1, $2, $3)
       on conflict (account, dc) do update set key = $3`,
      [this._account, dc, key],
    )
  }

  async get(dc: number): Promise<Uint8Array | null> {
    const res = await this._driver.client.query<AuthKeyDto>(
      `select key from ${this._authKeys} where account = $1 and dc = $2`,
      [this._account, dc],
    )
    if (!res.rows[0]) return null

    return new Uint8Array(res.rows[0].key)
  }

  async setTemp(dc: number, idx: number, key: Uint8Array | null, expires: number): Promise<void> {
    if (!key) {
      await this._driver.client.query(
        `delete from ${this._tempAuthKeys} where account = $1 and dc = $2 and idx = $3`,
        [this._account, dc, idx],
      )

      return
    }

    await this._driver.client.query(
      `insert into ${this._tempAuthKeys} (account, dc, idx, key, expires) values ($1, $2, $3, $4, $5)
       on conflict (account, dc, idx) do update set key = $4, expires = $5`,
      [this._account, dc, idx, key, expires],
    )
  }

  async getTemp(dc: number, idx: number, now: number): Promise<Uint8Array | null> {
    const res = await this._driver.client.query<AuthKeyDto>(
      `select key from ${this._tempAuthKeys} where account = $1 and dc = $2 and idx = $3 and expires > $4`,
      [this._account, dc, idx, now],
    )
    if (!res.rows[0]) return null

    return new Uint8Array(res.rows[0].key)
  }

  async deleteByDc(dc: number): Promise<void> {
    await this._driver.client.query(`delete from ${this._authKeys} where account = $1 and dc = $2`, [this._account, dc])
    await this._driver.client.query(`delete from ${this._tempAuthKeys} where account = $1 and dc = $2`, [this._account, dc])
  }

  async deleteAll(): Promise<void> {
    await this._driver.client.query(`delete from ${this._authKeys} where account = $1`, [this._account])
    await this._driver.client.query(`delete from ${this._tempAuthKeys} where account = $1`, [this._account])
  }
}
