import { Statement } from 'better-sqlite3'

import { IReferenceMessagesRepository } from '@mtcute/core/src/storage/repository/ref-messages.js'

import { SqliteStorageDriver } from '../driver.js'

interface ReferenceMessageDto {
    peer_id: number
    chat_id: number
    msg_id: number
}

export class SqliteRefMessagesRepository implements IReferenceMessagesRepository {
    constructor(readonly _driver: SqliteStorageDriver) {
        _driver.registerMigration('ref_messages', 1, (db) => {
            db.exec(`
                create table message_refs (
                    peer_id integer not null,
                    chat_id integer not null,
                    msg_id integer not null
                );
                create index idx_message_refs_peer on message_refs (peer_id);
                create index idx_message_refs on message_refs (chat_id, msg_id);
            `)
        })
        _driver.onLoad(() => {
            this._store = this._driver.db.prepare('insert or replace into message_refs (peer_id, chat_id, msg_id) values (?, ?, ?)')

            this._getByPeer = this._driver.db.prepare('select chat_id, msg_id from message_refs where peer_id = ?')

            this._del = this._driver.db.prepare('delete from message_refs where chat_id = ? and msg_id = ?')
            this._delByPeer = this._driver.db.prepare('delete from message_refs where peer_id = ?')
            this._delAll = this._driver.db.prepare('delete from message_refs')
        })
    }

    private _store!: Statement
    store(peerId: number, chatId: number, msgId: number): void {
        this._store.run(peerId, chatId, msgId)
    }

    private _getByPeer!: Statement
    getByPeer(peerId: number): [number, number] | null {
        const res = this._getByPeer.get(peerId)
        if (!res) return null

        const res_ = res as ReferenceMessageDto

        return [res_.chat_id, res_.msg_id]
    }

    private _del!: Statement
    delete(chatId: number, msgIds: number[]): void {
        for (const msgId of msgIds) {
            this._driver._writeLater(this._del, [chatId, msgId])
        }
    }

    private _delByPeer!: Statement
    deleteByPeer(peerId: number): void {
        this._delByPeer.run(peerId)
    }

    private _delAll!: Statement
    deleteAll(): void {
        this._delAll.run()
    }
}
