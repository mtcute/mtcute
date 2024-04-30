import { afterAll, beforeAll, describe } from 'vitest'

import { LogManager } from '@mtcute/core/utils.js'
import {
    testAuthKeysRepository,
    testKeyValueRepository,
    testPeersRepository,
    testRefMessagesRepository,
} from '@mtcute/test'

if (import.meta.env.TEST_ENV === 'deno') {
    // load sqlite in advance so test runner doesn't complain about us leaking the library
    // (it's not on us, @db/sqlite doesn't provide an api to unload the library)
    await import('@db/sqlite')
    const { SqliteStorage } = await import('./index.js')

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
