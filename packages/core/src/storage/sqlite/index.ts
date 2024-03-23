import { ITelegramStorageProvider } from '../../highlevel/storage/provider.js'
import { IMtStorageProvider } from '../provider.js'
import { BaseSqliteStorageDriver } from './driver.js'
import { SqliteAuthKeysRepository } from './repository/auth-keys.js'
import { SqliteKeyValueRepository } from './repository/kv.js'
import { SqlitePeersRepository } from './repository/peers.js'
import { SqliteRefMessagesRepository } from './repository/ref-messages.js'

export { BaseSqliteStorageDriver }
export * from './types.js'

export class BaseSqliteStorage implements IMtStorageProvider, ITelegramStorageProvider {
    constructor(readonly driver: BaseSqliteStorageDriver) {}

    readonly authKeys = new SqliteAuthKeysRepository(this.driver)
    readonly kv = new SqliteKeyValueRepository(this.driver)
    readonly refMessages = new SqliteRefMessagesRepository(this.driver)
    readonly peers = new SqlitePeersRepository(this.driver)
}
