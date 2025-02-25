import type { IPeersRepository } from '@mtcute/core'

import type { IdbStorageDriver } from '../driver.js'
import { reqToPromise } from '../utils.js'

const TABLE = 'peers'

// <deno-insert>
// declare type IDBTransactionMode = any
// declare type IDBObjectStore = any
// declare type IDBRequest<T> = { result: T }
// </deno-insert>

export class IdbPeersRepository implements IPeersRepository {
    constructor(readonly _driver: IdbStorageDriver) {
        _driver.registerMigration(TABLE, 1, (db) => {
            const os = db.createObjectStore(TABLE, { keyPath: 'id' })
            os.createIndex('by_username', 'usernames', { unique: true, multiEntry: true })
            os.createIndex('by_phone', 'phone', { unique: true })
        })
    }

    store(peer: IPeersRepository.PeerInfo): void {
        this._driver.writeLater(TABLE, peer)
    }

    private os(mode?: IDBTransactionMode): IDBObjectStore {
        return this._driver.db.transaction(TABLE, mode).objectStore(TABLE)
    }

    async getById(id: number): Promise<IPeersRepository.PeerInfo | null> {
        const it = await reqToPromise(this.os().get(id) as IDBRequest<IPeersRepository.PeerInfo>)

        if (!it) return null
        // NB: older objects might not have isMin field
        if (!('isMin' in it)) (it as any).isMin = false

        return it
    }

    async getByUsername(username: string): Promise<IPeersRepository.PeerInfo | null> {
        const it = await reqToPromise(
            this.os().index('by_username').get(username) as IDBRequest<IPeersRepository.PeerInfo>,
        )

        // NB: older objects might not have isMin field
        if (!it || it.isMin) return null

        return it
    }

    async getByPhone(phone: string): Promise<IPeersRepository.PeerInfo | null> {
        const it = await reqToPromise(this.os().index('by_phone').get(phone) as IDBRequest<IPeersRepository.PeerInfo>)

        // NB: older objects might not have isMin field
        if (!it || it.isMin) return null

        return it
    }

    deleteAll(): Promise<void> {
        return reqToPromise(this.os('readwrite').clear())
    }
}
