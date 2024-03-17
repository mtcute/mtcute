import { afterAll, beforeAll, describe } from 'vitest'

import { LogManager } from '@mtcute/core/utils.js'
import {
    testAuthKeysRepository,
    testKeyValueRepository,
    testPeersRepository,
    testRefMessagesRepository,
} from '@mtcute/test'

import { SqliteStorage } from '../src/index.js'

if (import.meta.env.TEST_ENV === 'node') {
    describe('SqliteStorage', () => {
        const storage = new SqliteStorage(':memory:')

        beforeAll(async () => {
            storage.driver.setup(new LogManager())
            await storage.driver.load()
        })

        testAuthKeysRepository(storage.authKeys)
        testKeyValueRepository(storage.kv, storage.driver)
        testPeersRepository(storage.peers, storage.driver)
        testRefMessagesRepository(storage.refMessages, storage.driver)

        afterAll(() => storage.driver.destroy())
    })
} else {
    describe.skip('SqliteStorage', () => {})
}
