import type { IKeyValueRepository } from '@mtcute/core'

import type { IdbStorageDriver } from '../driver.js'
import { reqToPromise } from '../utils.js'

const KV_TABLE = 'kv'
interface KeyValueDto {
    key: string
    value: Uint8Array
}

// <deno-insert>
// declare type IDBTransactionMode = any
// declare type IDBObjectStore = any
// declare type IDBRequest<T> = { result: T }
// </deno-insert>

export class IdbKvRepository implements IKeyValueRepository {
    constructor(readonly _driver: IdbStorageDriver) {
        _driver.registerMigration(KV_TABLE, 1, (db) => {
            db.createObjectStore(KV_TABLE, { keyPath: 'key' })
        })
    }

    set(key: string, value: Uint8Array): void {
        this._driver.writeLater(KV_TABLE, { key, value } satisfies KeyValueDto)
    }

    private os(mode?: IDBTransactionMode): IDBObjectStore {
        return this._driver.db.transaction(KV_TABLE, mode).objectStore(KV_TABLE)
    }

    async get(key: string): Promise<Uint8Array | null> {
        const os = this.os()
        const res = await reqToPromise<KeyValueDto>(os.get(key) as IDBRequest<KeyValueDto>)
        if (res === undefined) return null

        return res.value
    }

    async delete(key: string): Promise<void> {
        await reqToPromise(this.os('readwrite').delete(key))
    }

    async deleteAll(): Promise<void> {
        await reqToPromise(this.os('readwrite').clear())
    }
}
