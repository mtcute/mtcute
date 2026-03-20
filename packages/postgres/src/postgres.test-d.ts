import type { PgClient } from './driver.js'
import { PGlite } from '@electric-sql/pglite'
import { Client, Pool } from 'pg'
import { assertType, test } from 'vitest'

test('postgres types', async () => {
  // @types/pg
  assertType<PgClient>(new Client())
  const pool = new Pool()
  assertType<PgClient>(pool)
  assertType<PgClient>(await pool.connect())

  // pglite
  assertType<PgClient>(new PGlite())
})
