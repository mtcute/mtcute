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
  }

  async store(peerId: number, chatId: number, msgId: number): Promise<void> {
    await this._driver.client.query(
      `insert into ${this._table} (peer_id, chat_id, msg_id) values ($1, $2, $3)`,
      [peerId, chatId, msgId],
    )
  }

  async getByPeer(peerId: number): Promise<[number, number] | null> {
    const res = await this._driver.client.query<ReferenceMessageDto>(
      `select chat_id, msg_id from ${this._table} where peer_id = $1 limit 1`,
      [peerId],
    )
    if (!res.rows[0]) return null

    const row = res.rows[0]

    return [parseBigint(row.chat_id), row.msg_id]
  }

  async delete(chatId: number, msgIds: number[]): Promise<void> {
    if (msgIds.length === 0) return

    await this._driver.client.query(
      `delete from ${this._table} where chat_id = $1 and msg_id = any($2)`,
      [chatId, msgIds],
    )
  }

  async deleteByPeer(peerId: number): Promise<void> {
    await this._driver.client.query(`delete from ${this._table} where peer_id = $1`, [peerId])
  }

  async deleteAll(): Promise<void> {
    await this._driver.client.query(`delete from ${this._table}`)
  }
}
