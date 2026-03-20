import { LogManager } from '@mtcute/core/utils.js'
import {
  defaultPlatform,
  testAuthKeysRepository,
  testKeyValueRepository,
  testPeersRepository,
  testRefMessagesRepository,
} from '@mtcute/test'
import { afterAll, beforeAll, describe } from 'vitest'

if (process.env.TEST_ENV !== 'web' && process.env.WITH_POSTGRES_TESTS) {
  const { PGlite } = await import('@electric-sql/pglite')
  const { Pool } = await import('pg')
  const { PostgresStorage } = await import('./index.js')
  const { mkdtemp, rm } = await import('node:fs/promises')
  const { tmpdir } = await import('node:os')
  const { dirname, join } = await import('node:path')
  const { PGLiteSocketServer } = await import('@electric-sql/pglite-socket')

  describe('PostgresStorage (pglite)', async () => {
    const pglite = await PGlite.create()
    const storage = new PostgresStorage(pglite, { schema: 'mtcute_test' })

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
      await pglite.close()
    })
  })

  describe('PostgresStorage (pg)', async () => {
    const pglite = await PGlite.create()
    const socketPath = `${await mkdtemp(join(tmpdir(), 'mtcute-test-'))}/.s.PGSQL.5432`
    const server = new PGLiteSocketServer({
      db: pglite,
      path: socketPath,
    })
    await server.start()

    const pool = new Pool({
      user: 'postgres',
      password: 'postgres',
      database: 'postgres',
      host: dirname(socketPath),
    })
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
      await server.stop()
      await pglite.close()
      await rm(dirname(socketPath), { recursive: true })
    })
  })
} else {
  describe.skip('PostgresStorage', () => {})
}
