import {
    testAuthKeysRepository,
    testKeyValueRepository,
    testPeersRepository,
    testRefMessagesRepository,
} from '@mtcute/test'
import { expect } from 'chai'

import { afterAll, beforeAll, describe, it } from 'vitest'
import { IdbStorage } from './index.js'

if (import.meta.env.TEST_ENV === 'browser') {
    describe('idb storage', () => {
        const idbName = `mtcute_test_${Math.random().toString(36).slice(2)}`

        const storage = new IdbStorage(idbName)

        beforeAll(() => storage.driver.load())

        testAuthKeysRepository(storage.authKeys)
        testKeyValueRepository(storage.kv, storage.driver)
        testPeersRepository(storage.peers, storage.driver)
        testRefMessagesRepository(storage.refMessages, storage.driver)

        it('should support multiple connections', async () => {
            const storage2 = new IdbStorage(idbName)
            await storage2.driver.load()

            expect(storage2.driver.db.version).to.equal(storage.driver.db.version)
        })

        afterAll(async () => {
            await storage.driver.destroy()

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
