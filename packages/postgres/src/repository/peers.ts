import type { IPeersRepository } from '@mtcute/core'
import type { PostgresStorageDriver } from '../driver.js'

import { MtcuteError } from '@mtcute/core'
import { parseBigint, parseJsonb } from '../_utils.js'

interface PeerDto {
  id: string
  hash: string
  is_min: boolean
  usernames: string[]
  updated: number
  phone: string | null
  complete: import('node:buffer').Buffer
}

function mapPeerDto(dto: PeerDto): IPeersRepository.PeerInfo {
  return {
    id: Number(dto.id),
    accessHash: dto.hash,
    isMin: dto.is_min,
    usernames: parseJsonb(dto.usernames),
    updated: parseBigint(dto.updated),
    phone: dto.phone || undefined,
    complete: new Uint8Array(dto.complete),
  }
}

export class PostgresPeersRepository implements IPeersRepository {
  private _loaded = false
  private _table: string

  constructor(readonly _driver: PostgresStorageDriver) {
    this._table = _driver.tableName('peers')

    _driver.registerMigration('peers', 1, async (client) => {
      await client.query(`
        create table if not exists ${this._table} (
            id bigint primary key,
            hash text not null,
            is_min boolean not null default false,
            usernames jsonb not null,
            updated bigint not null,
            phone text,
            complete bytea
        );
      `)
      await client.query(`
        create index if not exists idx_peers_phone on ${this._table} (phone);
      `)
    })

    _driver.registerMigration('peers', 2, async (client) => {
      await client.query(`alter table ${this._table} add column account text not null default 'default'`)
      await client.query(`alter table ${this._table} drop constraint peers_pkey`)
      await client.query(`alter table ${this._table} add primary key (account, id)`)
      await client.query(`drop index if exists ${_driver.tableName('idx_peers_phone')}`)
      await client.query(`create index idx_peers_phone on ${this._table} (account, phone)`)
    })

    _driver.onLoad(() => {
      this._loaded = true
    })
  }

  private get _account(): string {
    return this._driver.account
  }

  private _ensureLoaded(): void {
    if (!this._loaded) {
      throw new MtcuteError('Peers repository is not loaded. Have you called client.start() (or similar)?')
    }
  }

  async store(peer: IPeersRepository.PeerInfo): Promise<void> {
    await this._driver.client.query(
      `insert into ${this._table} (account, id, hash, is_min, usernames, updated, phone, complete)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       on conflict (account, id) do update set
          hash = $3, is_min = $4, usernames = $5, updated = $6, phone = $7, complete = $8`,
      [
        this._account,
        peer.id,
        peer.accessHash,
        peer.isMin,
        JSON.stringify(peer.usernames),
        peer.updated,
        peer.phone ?? null,
        peer.complete,
      ],
    )
  }

  async getById(id: number): Promise<IPeersRepository.PeerInfo | null> {
    this._ensureLoaded()
    const res = await this._driver.client.query<PeerDto>(
      `select * from ${this._table} where account = $1 and id = $2`,
      [this._account, id],
    )
    if (!res.rows[0]) return null

    return mapPeerDto(res.rows[0])
  }

  async getByUsername(username: string): Promise<IPeersRepository.PeerInfo | null> {
    this._ensureLoaded()
    const res = await this._driver.client.query<PeerDto>(
      `select * from ${this._table} where account = $1 and usernames ? $2 and is_min = false`,
      [this._account, username],
    )
    if (!res.rows[0]) return null

    return mapPeerDto(res.rows[0])
  }

  async getByPhone(phone: string): Promise<IPeersRepository.PeerInfo | null> {
    this._ensureLoaded()
    const res = await this._driver.client.query<PeerDto>(
      `select * from ${this._table} where account = $1 and phone = $2 and is_min = false`,
      [this._account, phone],
    )
    if (!res.rows[0]) return null

    return mapPeerDto(res.rows[0])
  }

  async deleteAll(): Promise<void> {
    await this._driver.client.query(`delete from ${this._table} where account = $1`, [this._account])
  }
}
