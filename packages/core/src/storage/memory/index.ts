import { ITelegramStorageProvider } from '../../highlevel/storage/provider.js'
import { IMtStorageProvider } from '../provider.js'
import { MemoryStorageDriver } from './driver.js'
import { MemoryAuthKeysRepository } from './repository/auth-keys.js'
import { MemoryKeyValueRepository } from './repository/kv.js'
import { MemoryPeersRepository } from './repository/peers.js'
import { MemoryRefMessagesRepository } from './repository/ref-messages.js'

export { MemoryStorageDriver } from './driver.js'

/**
 * In-memory storage driver implementation for mtcute.
 *
 * This storage is **not persistent**, meaning that all data
 * **will** be lost on restart. Only use this storage for testing,
 * or if you know exactly what you're doing.
 */
export class MemoryStorage implements IMtStorageProvider, ITelegramStorageProvider {
    readonly driver = new MemoryStorageDriver()
    readonly kv = new MemoryKeyValueRepository(this.driver)
    readonly authKeys = new MemoryAuthKeysRepository(this.driver)
    readonly peers = new MemoryPeersRepository(this.driver)
    readonly refMessages = new MemoryRefMessagesRepository(this.driver)
}
