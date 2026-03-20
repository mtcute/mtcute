import type { PgClient } from './driver.js'
import { PGlite } from '@electric-sql/pglite'
import { Client, Pool } from 'pg'
import { assertType, test } from 'vitest'

test('postgres types', () => {
  // @types/pg
  assertType<PgClient>(new Client())
  assertType<PgClient>(new Pool())

  // pglite
  assertType<PgClient>(new PGlite())
})
