import type { IPeersRepository } from '@mtcute/core'

import type { IdbStorageDriver } from '../driver.js'
import { reqToPromise } from '../utils.js'

const TABLE = 'peers'

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

        return it ?? null
    }

    async getByUsername(username: string): Promise<IPeersRepository.PeerInfo | null> {
        const it = await reqToPromise(
            this.os().index('by_username').get(username) as IDBRequest<IPeersRepository.PeerInfo>,
        )

        return it ?? null
    }

    async getByPhone(phone: string): Promise<IPeersRepository.PeerInfo | null> {
        const it = await reqToPromise(this.os().index('by_phone').get(phone) as IDBRequest<IPeersRepository.PeerInfo>)

        return it ?? null
    }

    deleteAll(): Promise<void> {
        return reqToPromise(this.os('readwrite').clear())
    }
}
