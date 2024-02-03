import { IMtStorageProvider, ITelegramStorageProvider } from '@mtcute/core'

import { SqliteStorageDriver, SqliteStorageDriverOptions } from './driver.js'
import { SqliteAuthKeysRepository } from './repository/auth-keys.js'
import { SqliteKeyValueRepository } from './repository/kv.js'
import { SqlitePeersRepository } from './repository/peers.js'
import { SqliteRefMessagesRepository } from './repository/ref-messages.js'

export { SqliteStorageDriver } from './driver.js'
export type { Statement } from 'better-sqlite3'

export class SqliteStorage implements IMtStorageProvider, ITelegramStorageProvider {
    constructor(
        readonly filename = ':memory:',
        readonly params?: SqliteStorageDriverOptions,
    ) {}

    readonly driver = new SqliteStorageDriver(this.filename, this.params)

    readonly authKeys = new SqliteAuthKeysRepository(this.driver)
    readonly kv = new SqliteKeyValueRepository(this.driver)
    readonly refMessages = new SqliteRefMessagesRepository(this.driver)
    readonly peers = new SqlitePeersRepository(this.driver)
}
