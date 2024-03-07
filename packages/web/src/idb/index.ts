import { IMtStorageProvider } from '@mtcute/core'

import { IdbStorageDriver } from './driver.js'
import { IdbAuthKeysRepository } from './repository/auth-keys.js'
import { IdbKvRepository } from './repository/kv.js'
import { IdbPeersRepository } from './repository/peers.js'
import { IdbRefMsgRepository } from './repository/ref-messages.js'

export { IdbStorageDriver } from './driver.js'

/**
 * mtcute storage that uses IndexedDB as a backend.
 *
 * This storage is the default one for browsers, and is generally
 * recommended over local storage based one.
 */
export class IdbStorage implements IMtStorageProvider {
    constructor(readonly dbName: string) {}

    readonly driver = new IdbStorageDriver(this.dbName)
    readonly kv = new IdbKvRepository(this.driver)
    readonly authKeys = new IdbAuthKeysRepository(this.driver)
    readonly peers = new IdbPeersRepository(this.driver)
    readonly refMessages = new IdbRefMsgRepository(this.driver)
}
