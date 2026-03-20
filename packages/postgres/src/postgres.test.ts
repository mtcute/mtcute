import { LogManager } from '@mtcute/core/utils.js'
import {
  defaultPlatform,
  testAuthKeysRepository,
  testKeyValueRepository,
  testPeersRepository,
  testRefMessagesRepository,
} from '@mtcute/test'
import { afterAll, beforeAll, describe } from 'vitest'

const pgUrl = process.env.POSTGRES_URL

if (pgUrl) {
  const pg = await import('pg')
  const { PostgresStorage } = await import('./index.js')

  describe('PostgresStorage', () => {
    const PoolCtor = pg.default?.Pool ?? pg.Pool
    const pool = new PoolCtor({ connectionString: pgUrl })
    const storage = new PostgresStorage(pool, { schema: 'mtcute_test' })

    beforeAll(async () => {
      storage.driver.setup(new LogManager(undefined, defaultPlatform), defaultPlatform)
      await storage.driver.load()
    })

    testAuthKeysRepository(storage.authKeys)
    testKeyValueRepository(storage.kv, storage.driver)
    testPeersRepository(storage.peers, storage.driver)
    testRefMessagesRepository(storage.refMessages, storage.driver)

    afterAll(async () => {
      await storage.driver.destroy()
      await pool.end()
    })
  })
} else {
  describe.skip('PostgresStorage', () => {})
}
