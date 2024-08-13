import type { IMtStorageProvider } from '@mtcute/core'

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
    readonly driver
    readonly kv
    readonly authKeys
    readonly peers
    readonly refMessages

    constructor(readonly dbName: string) {
        this.driver = new IdbStorageDriver(this.dbName)
        this.kv = new IdbKvRepository(this.driver)
        this.authKeys = new IdbAuthKeysRepository(this.driver)
        this.peers = new IdbPeersRepository(this.driver)
        this.refMessages = new IdbRefMsgRepository(this.driver)
    }
}
