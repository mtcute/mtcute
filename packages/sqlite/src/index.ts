import { BaseSqliteStorage } from '@mtcute/core'

import { SqliteStorageDriver, SqliteStorageDriverOptions } from './driver.js'

export { SqliteStorageDriver } from './driver.js'
export type { Statement } from 'better-sqlite3'

export class SqliteStorage extends BaseSqliteStorage {
    constructor(
        readonly filename = ':memory:',
        readonly params?: SqliteStorageDriverOptions,
    ) {
        super(new SqliteStorageDriver(filename, params))
    }
}
