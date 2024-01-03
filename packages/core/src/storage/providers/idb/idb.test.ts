import { afterAll, beforeAll, describe } from 'vitest'

import { testAuthKeysRepository } from '../../repository/auth-keys.test-utils.js'
import { testKeyValueRepository } from '../../repository/key-value.test-utils.js'
import { testPeersRepository } from '../../repository/peers.test-utils.js'
import { testRefMessagesRepository } from '../../repository/ref-messages.test-utils.js'
import { IdbStorage } from './index.js'

if (import.meta.env.TEST_ENV === 'browser') {
    describe('idb storage', () => {
        const idbName = 'mtcute_test_' + Math.random().toString(36).slice(2)

        const storage = new IdbStorage(idbName)

        beforeAll(() => storage.driver.load())

        testAuthKeysRepository(storage.authKeys)
        testKeyValueRepository(storage.kv, storage.driver)
        testPeersRepository(storage.peers, storage.driver)
        testRefMessagesRepository(storage.refMessages, storage.driver)

        afterAll(async () => {
            storage.driver.destroy()

            const req = indexedDB.deleteDatabase(idbName)
            await new Promise<void>((resolve, reject) => {
                req.onerror = () => reject(req.error)
                req.onsuccess = () => resolve()
                req.onblocked = () => resolve()
            })
        })
    })
} else {
    describe.skip('idb storage', () => {})
}
