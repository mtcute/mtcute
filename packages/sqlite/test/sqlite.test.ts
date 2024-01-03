import { afterAll, beforeAll, describe } from 'vitest'

import { testAuthKeysRepository } from '@mtcute/core/src/storage/repository/auth-keys.test-utils.js'
import { testKeyValueRepository } from '@mtcute/core/src/storage/repository/key-value.test-utils.js'
import { testPeersRepository } from '@mtcute/core/src/storage/repository/peers.test-utils.js'
import { testRefMessagesRepository } from '@mtcute/core/src/storage/repository/ref-messages.test-utils.js'
import { LogManager } from '@mtcute/core/utils.js'

import { SqliteStorage } from '../src/index.js'

if (import.meta.env.TEST_ENV === 'node') {
    describe('SqliteStorage', () => {
        const storage = new SqliteStorage(':memory:')

        beforeAll(() => {
            storage.driver.setup(new LogManager())
            storage.driver.load()
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
