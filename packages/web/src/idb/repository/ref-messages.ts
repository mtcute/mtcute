import type { IReferenceMessagesRepository } from '@mtcute/core'

import type { IdbStorageDriver } from '../driver.js'
import { reqToPromise, txToPromise } from '../utils.js'

const TABLE = 'messageRefs'

interface MessageRefDto {
    peerId: number
    chatId: number
    msgId: number
}

// <deno-insert>
// declare type IDBTransactionMode = any
// declare type IDBObjectStore = any
// declare type IDBValidKey = any
// declare type IDBRequest<T> = { result: T }
// declare type IDBCursorWithValue = { delete: () => void, continue: () => void }
// </deno-insert>

export class IdbRefMsgRepository implements IReferenceMessagesRepository {
    constructor(readonly _driver: IdbStorageDriver) {
        _driver.registerMigration(TABLE, 1, (db) => {
            const os = db.createObjectStore(TABLE, { keyPath: ['peerId', 'chatId', 'msgId'] })
            os.createIndex('by_peer', 'peerId')
            os.createIndex('by_msg', ['chatId', 'msgId'])
        })
    }

    private os(mode?: IDBTransactionMode): IDBObjectStore {
        return this._driver.db.transaction(TABLE, mode).objectStore(TABLE)
    }

    async store(peerId: number, chatId: number, msgId: number): Promise<void> {
        const os = this.os('readwrite')

        await reqToPromise(os.put({ peerId, chatId, msgId } satisfies MessageRefDto))
    }

    async getByPeer(peerId: number): Promise<[number, number] | null> {
        const os = this.os()
        const index = os.index('by_peer')

        const it = await reqToPromise<MessageRefDto>(index.get(peerId) as IDBRequest<MessageRefDto>)
        if (!it) return null

        return [it.chatId, it.msgId]
    }

    async delete(chatId: number, msgIds: number[]): Promise<void> {
        const tx = this._driver.db.transaction(TABLE, 'readwrite')
        const os = tx.objectStore(TABLE)
        const index = os.index('by_msg')

        for (const msgId of msgIds) {
            const keys = await reqToPromise<IDBValidKey[]>(index.getAllKeys([chatId, msgId]))

            // there are never that many keys, so we can avoid using cursor
            for (const key of keys) {
                os.delete(key)
            }
        }

        return txToPromise(tx)
    }

    async deleteByPeer(peerId: number): Promise<void> {
        const tx = this._driver.db.transaction(TABLE, 'readwrite')
        const os = tx.objectStore(TABLE)
        const index = os.index('by_peer')

        const req = index.openCursor(peerId)

        let cursor = await reqToPromise<IDBCursorWithValue | null>(req)

        while (cursor) {
            cursor.delete()
            cursor.continue()
            cursor = await reqToPromise<IDBCursorWithValue | null>(req)
        }

        return txToPromise(tx)
    }

    async deleteAll(): Promise<void> {
        await reqToPromise(this.os('readwrite').clear())
    }
}
