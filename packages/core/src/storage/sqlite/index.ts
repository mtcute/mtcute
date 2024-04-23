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
    readonly authKeys
    readonly kv
    readonly refMessages
    readonly peers

    constructor(readonly driver: BaseSqliteStorageDriver) {
        this.authKeys = new SqliteAuthKeysRepository(this.driver)
        this.kv = new SqliteKeyValueRepository(this.driver)
        this.refMessages = new SqliteRefMessagesRepository(this.driver)
        this.peers = new SqlitePeersRepository(this.driver)
    }
}
