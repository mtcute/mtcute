import type { ITelegramStorageProvider } from '../../highlevel/storage/provider.js'
import type { IMtStorageProvider } from '../provider.js'

import { MemoryStorageDriver } from './driver.js'
import { MemoryAuthKeysRepository } from './repository/auth-keys.js'
import { MemoryKeyValueRepository } from './repository/kv.js'
import { MemoryPeersRepository } from './repository/peers.js'
import { MemoryRefMessagesRepository } from './repository/ref-messages.js'

export { MemoryStorageDriver } from './driver.js'
export { MemoryAuthKeysRepository } from './repository/auth-keys.js'
export { MemoryKeyValueRepository } from './repository/kv.js'
export { MemoryPeersRepository } from './repository/peers.js'
export { MemoryRefMessagesRepository } from './repository/ref-messages.js'

/**
 * In-memory storage driver implementation for mtcute.
 *
 * This storage is **not persistent**, meaning that all data
 * **will** be lost on restart. Only use this storage for testing,
 * or if you know exactly what you're doing.
 */
export class MemoryStorage implements IMtStorageProvider, ITelegramStorageProvider {
  readonly driver: MemoryStorageDriver = new MemoryStorageDriver()
  readonly kv: MemoryKeyValueRepository = new MemoryKeyValueRepository(this.driver)
  readonly authKeys: MemoryAuthKeysRepository = new MemoryAuthKeysRepository(this.driver)
  readonly peers: MemoryPeersRepository = new MemoryPeersRepository(this.driver)
  readonly refMessages: MemoryRefMessagesRepository = new MemoryRefMessagesRepository(this.driver)
}
