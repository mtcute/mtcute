import { IStorageDriver } from './driver.js'
import { IAuthKeysRepository } from './repository/auth-keys.js'
import { IKeyValueRepository } from './repository/key-value.js'

export type IStorageProvider<T> = T & {
    readonly driver: IStorageDriver
}

export type IMtStorageProvider = IStorageProvider<{
    readonly kv: IKeyValueRepository
    readonly authKeys: IAuthKeysRepository
}>
