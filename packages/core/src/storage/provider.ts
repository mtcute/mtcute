import { IStorageDriver } from './driver.js'
import { IAuthKeysRepository } from './repository/auth-keys.js'
import { IKeyValueRepository } from './repository/key-value.js'
import { IPeersRepository } from './repository/peers.js'
import { IReferenceMessagesRepository } from './repository/ref-messages.js'

export type IStorageProvider<T> = T & {
    readonly driver: IStorageDriver
}

export type IMtStorageProvider = IStorageProvider<{
    readonly kv: IKeyValueRepository
    readonly authKeys: IAuthKeysRepository
    readonly peers: IPeersRepository
    readonly refMessages: IReferenceMessagesRepository
}>
