import type { IReferenceMessagesRepository } from '@mtcute/core'
import type { PostgresStorageDriver } from '../driver.js'
import { parseBigint } from '../_utils.js'

interface ReferenceMessageDto {
  peer_id: string | number
  chat_id: string | number
  msg_id: number
}

export class PostgresRefMessagesRepository implements IReferenceMessagesRepository {
  private _table: string

  constructor(readonly _driver: PostgresStorageDriver) {
    this._table = _driver.tableName('message_refs')

    _driver.registerMigration('ref_messages', 1, async (client) => {
      await client.query(`
        create table if not exists ${this._table} (
            peer_id bigint not null,
            chat_id bigint not null,
            msg_id integer not null
        );
      `)
      await client.query(`create index if not exists idx_message_refs_peer on ${this._table} (peer_id);`)
      await client.query(`create index if not exists idx_message_refs on ${this._table} (chat_id, msg_id);`)
    })

    _driver.registerMigration('ref_messages', 2, async (client) => {
      await client.query(`alter table ${this._table} add column account text not null default 'default'`)
      await client.query(`drop index if exists ${_driver.tableName('idx_message_refs_peer')}`)
      await client.query(`drop index if exists ${_driver.tableName('idx_message_refs')}`)
      await client.query(`create index idx_message_refs_peer on ${this._table} (account, peer_id)`)
      await client.query(`create index idx_message_refs on ${this._table} (account, chat_id, msg_id)`)
    })
  }

  private get _account(): string {
    return this._driver.account
  }

  async store(peerId: number, chatId: number, msgId: number): Promise<void> {
    await this._driver.client.query(
      `insert into ${this._table} (account, peer_id, chat_id, msg_id) values ($1, $2, $3, $4)`,
      [this._account, peerId, chatId, msgId],
    )
  }

  async getByPeer(peerId: number): Promise<[number, number] | null> {
    const res = await this._driver.client.query<ReferenceMessageDto>(
      `select chat_id, msg_id from ${this._table} where account = $1 and peer_id = $2 limit 1`,
      [this._account, peerId],
    )
    if (!res.rows[0]) return null

    const row = res.rows[0]

    return [parseBigint(row.chat_id), row.msg_id]
  }

  async delete(chatId: number, msgIds: number[]): Promise<void> {
    if (msgIds.length === 0) return

    await this._driver.client.query(
      `delete from ${this._table} where account = $1 and chat_id = $2 and msg_id = any($3)`,
      [this._account, chatId, msgIds],
    )
  }

  async deleteByPeer(peerId: number): Promise<void> {
    await this._driver.client.query(
      `delete from ${this._table} where account = $1 and peer_id = $2`,
      [this._account, peerId],
    )
  }

  async deleteAll(): Promise<void> {
    await this._driver.client.query(`delete from ${this._table} where account = $1`, [this._account])
  }
}
