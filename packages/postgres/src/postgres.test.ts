import { LogManager } from '@mtcute/core/utils.js'
import {
  defaultPlatform,
  testAuthKeysRepository,
  testKeyValueRepository,
  testPeersRepository,
  testRefMessagesRepository,
} from '@mtcute/test'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

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
    const storage = new PostgresStorage(pglite, { schema: 'mtcute_test', autoClose: true })

    vi.spyOn(pglite, 'close')

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
      expect(pglite.close).toHaveBeenCalled()
    })
  })

  describe('PostgresStorage (pg.Pool)', async () => {
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
    vi.spyOn(pool, 'end')
    const storage = new PostgresStorage(pool, { schema: 'mtcute_test', autoClose: true })

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
      expect(pool.end).toHaveBeenCalled()
      await server.stop()
      await pglite.close()
      await rm(dirname(socketPath), { recursive: true })
    })
  })
  describe('PostgresStorage (account isolation)', async () => {
    const pglite = await PGlite.create()
    const storageA = new PostgresStorage(pglite, { schema: 'mtcute_iso', account: 'account_a', autoClose: false })
    const storageB = new PostgresStorage(pglite, { schema: 'mtcute_iso', account: 'account_b', autoClose: false })

    beforeAll(async () => {
      storageA.driver.setup(new LogManager(undefined, defaultPlatform), defaultPlatform)
      storageB.driver.setup(new LogManager(undefined, defaultPlatform), defaultPlatform)
      await storageA.driver.load()
      await storageB.driver.load()
    })

    afterAll(async () => {
      await storageA.driver.destroy()
      await storageB.driver.destroy()
      await pglite.close()
    })

    it('should isolate auth keys between accounts', async () => {
      const key = new Uint8Array([1, 2, 3])
      await storageA.authKeys.set(1, key)

      expect(await storageA.authKeys.get(1)).toEqual(key)
      expect(await storageB.authKeys.get(1)).toBeNull()
    })

    it('should isolate key-value between accounts', async () => {
      const value = new Uint8Array([4, 5, 6])
      await storageA.kv.set('test', value)

      expect(await storageA.kv.get('test')).toEqual(value)
      expect(await storageB.kv.get('test')).toBeNull()
    })

    it('should isolate peers between accounts', async () => {
      const peer: Parameters<typeof storageA.peers.store>[0] = {
        id: 123,
        accessHash: '456',
        isMin: false,
        usernames: ['alice'],
        updated: Date.now(),
        phone: '+1234567890',
        complete: new Uint8Array([7, 8, 9]),
      }

      await storageA.peers.store(peer)

      expect(await storageA.peers.getById(123)).not.toBeNull()
      expect(await storageB.peers.getById(123)).toBeNull()

      expect(await storageA.peers.getByUsername('alice')).not.toBeNull()
      expect(await storageB.peers.getByUsername('alice')).toBeNull()
    })

    it('should isolate ref messages between accounts', async () => {
      await storageA.refMessages.store(100, 200, 300)

      expect(await storageA.refMessages.getByPeer(100)).toEqual([200, 300])
      expect(await storageB.refMessages.getByPeer(100)).toBeNull()
    })

    it('deleteAll should only affect own account', async () => {
      const keyA = new Uint8Array([10, 11])
      const keyB = new Uint8Array([12, 13])
      await storageA.kv.set('shared_key', keyA)
      await storageB.kv.set('shared_key', keyB)

      await storageA.kv.deleteAll()

      expect(await storageA.kv.get('shared_key')).toBeNull()
      expect(await storageB.kv.get('shared_key')).toEqual(keyB)
    })
  })
} else {
  describe.skip('PostgresStorage', () => {})
}
