import { IReferenceMessagesRepository } from '../../../highlevel/storage/repository/ref-messages.js'
import { BaseSqliteStorageDriver } from '../driver.js'
import { ISqliteStatement } from '../types.js'

interface ReferenceMessageDto {
    peer_id: number
    chat_id: number
    msg_id: number
}

export class SqliteRefMessagesRepository implements IReferenceMessagesRepository {
    constructor(readonly _driver: BaseSqliteStorageDriver) {
        _driver.registerMigration('ref_messages', 1, (db) => {
            db.exec(`
                create table if not exists message_refs (
                    peer_id integer not null,
                    chat_id integer not null,
                    msg_id integer not null
                );
                create index if not exists idx_message_refs_peer on message_refs (peer_id);
                create index if not exists idx_message_refs on message_refs (chat_id, msg_id);
            `)
        })
        _driver.onLoad(() => {
            this._store = this._driver.db.prepare(
                'insert or replace into message_refs (peer_id, chat_id, msg_id) values (?, ?, ?)',
            )

            this._getByPeer = this._driver.db.prepare('select chat_id, msg_id from message_refs where peer_id = ?')

            this._del = this._driver.db.prepare('delete from message_refs where chat_id = ? and msg_id = ?')
            this._delByPeer = this._driver.db.prepare('delete from message_refs where peer_id = ?')
            this._delAll = this._driver.db.prepare('delete from message_refs')
        })
    }

    private _store!: ISqliteStatement
    store(peerId: number, chatId: number, msgId: number): void {
        this._store.run(peerId, chatId, msgId)
    }

    private _getByPeer!: ISqliteStatement
    getByPeer(peerId: number): [number, number] | null {
        const res = this._getByPeer.get(peerId)
        if (!res) return null

        const res_ = res as ReferenceMessageDto

        return [res_.chat_id, res_.msg_id]
    }

    private _del!: ISqliteStatement
    delete(chatId: number, msgIds: number[]): void {
        for (const msgId of msgIds) {
            this._driver._writeLater(this._del, [chatId, msgId])
        }
    }

    private _delByPeer!: ISqliteStatement
    deleteByPeer(peerId: number): void {
        this._delByPeer.run(peerId)
    }

    private _delAll!: ISqliteStatement
    deleteAll(): void {
        this._delAll.run()
    }
}
