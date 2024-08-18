import { BaseSqliteStorage } from '@mtcute/core'

import type { SqliteStorageDriverOptions } from './driver.js'
import { SqliteStorageDriver } from './driver.js'

export { SqliteStorageDriver } from './driver.js'

export class SqliteStorage extends BaseSqliteStorage {
    constructor(
        readonly filename = ':memory:',
        readonly params?: SqliteStorageDriverOptions | undefined,
    ) {
        super(new SqliteStorageDriver(filename, params))
    }
}
