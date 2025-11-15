import type { IAuthKeysRepository } from '@mtcute/core'

import type { IdbStorageDriver } from '../driver.js'
import { reqToPromise, txToPromise } from '../utils.js'

const TABLE_AUTH_KEYS = 'authKeys'
const TABLE_TEMP_AUTH_KEYS = 'tempAuthKeys'

// <deno-insert>
// declare type IDBTransactionMode = any
// declare type IDBObjectStore = any
// declare type IDBValidKey = any
// declare type IDBRequest<T> = { result: T }
// </deno-insert>

interface AuthKeyDto {
  dc: number
  key: Uint8Array
}
interface TempAuthKeyDto extends AuthKeyDto {
  expiresAt?: number
  idx?: number
}

export class IdbAuthKeysRepository implements IAuthKeysRepository {
  constructor(readonly _driver: IdbStorageDriver) {
    _driver.registerMigration(TABLE_AUTH_KEYS, 1, (db) => {
      db.createObjectStore(TABLE_AUTH_KEYS, { keyPath: 'dc' })
      db.createObjectStore(TABLE_TEMP_AUTH_KEYS, { keyPath: ['dc', 'idx'] })
    })
  }

  private os(mode?: IDBTransactionMode): IDBObjectStore {
    return this._driver.db.transaction(TABLE_AUTH_KEYS, mode).objectStore(TABLE_AUTH_KEYS)
  }

  async set(dc: number, key: Uint8Array | null): Promise<void> {
    const os = this.os('readwrite')

    if (key === null) {
      return reqToPromise(os.delete(dc))
    }

    await reqToPromise(os.put({ dc, key } satisfies AuthKeyDto))
  }

  async get(dc: number): Promise<Uint8Array | null> {
    const os = this.os()

    const it = await reqToPromise<AuthKeyDto>(os.get(dc) as IDBRequest<AuthKeyDto>)
    if (it === undefined) return null

    return it.key
  }

  private osTemp(mode?: IDBTransactionMode): IDBObjectStore {
    return this._driver.db.transaction(TABLE_TEMP_AUTH_KEYS, mode).objectStore(TABLE_TEMP_AUTH_KEYS)
  }

  async setTemp(dc: number, idx: number, key: Uint8Array | null, expires: number): Promise<void> {
    const os = this.osTemp('readwrite')

    if (!key) {
      return reqToPromise(os.delete([dc, idx]))
    }

    await reqToPromise(os.put({ dc, idx, key, expiresAt: expires } satisfies TempAuthKeyDto))
  }

  async getTemp(dc: number, idx: number, now: number): Promise<Uint8Array | null> {
    const os = this.osTemp()
    const row = await reqToPromise<TempAuthKeyDto>(os.get([dc, idx]) as IDBRequest<TempAuthKeyDto>)

    if (row === undefined || row.expiresAt! < now) return null

    return row.key
  }

  async deleteByDc(dc: number): Promise<void> {
    const tx = this._driver.db.transaction([TABLE_AUTH_KEYS, TABLE_TEMP_AUTH_KEYS], 'readwrite')

    tx.objectStore(TABLE_AUTH_KEYS).delete(dc)

    // IndexedDB sucks
    const tempOs = tx.objectStore(TABLE_TEMP_AUTH_KEYS)
    const keys = await reqToPromise<IDBValidKey[]>(tempOs.getAllKeys())

    for (const key of keys) {
      if ((key as [number, number])[0] === dc) {
        tempOs.delete(key)
      }
    }

    await txToPromise(tx)
  }

  deleteAll(): Promise<void> {
    const tx = this._driver.db.transaction([TABLE_AUTH_KEYS, TABLE_TEMP_AUTH_KEYS], 'readwrite')
    tx.objectStore(TABLE_AUTH_KEYS).clear()
    tx.objectStore(TABLE_TEMP_AUTH_KEYS).clear()

    return txToPromise(tx)
  }
}
