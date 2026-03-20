import type { IMtStorageProvider, ITelegramStorageProvider } from '@mtcute/core'
import type { PgClient, PostgresStorageDriverOptions } from './driver.js'

import { PostgresStorageDriver } from './driver.js'
import { PostgresAuthKeysRepository } from './repository/auth-keys.js'
import { PostgresKeyValueRepository } from './repository/kv.js'
import { PostgresPeersRepository } from './repository/peers.js'
import { PostgresRefMessagesRepository } from './repository/ref-messages.js'

export type { PgClient, PostgresStorageDriverOptions } from './driver.js'
export { PostgresStorageDriver } from './driver.js'
export { PostgresAuthKeysRepository } from './repository/auth-keys.js'
export { PostgresKeyValueRepository } from './repository/kv.js'
export { PostgresPeersRepository } from './repository/peers.js'
export { PostgresRefMessagesRepository } from './repository/ref-messages.js'

export class PostgresStorage implements IMtStorageProvider, ITelegramStorageProvider {
  readonly driver: PostgresStorageDriver
  readonly authKeys: PostgresAuthKeysRepository
  readonly kv: PostgresKeyValueRepository
  readonly peers: PostgresPeersRepository
  readonly refMessages: PostgresRefMessagesRepository

  constructor(client: PgClient, options?: PostgresStorageDriverOptions) {
    this.driver = new PostgresStorageDriver(client, options)
    this.authKeys = new PostgresAuthKeysRepository(this.driver)
    this.kv = new PostgresKeyValueRepository(this.driver)
    this.peers = new PostgresPeersRepository(this.driver)
    this.refMessages = new PostgresRefMessagesRepository(this.driver)
  }
}
