import { afterAll, describe } from 'vitest'

import { testStateStorage, testStorage } from '@mtcute/test'

import { IdbStorage } from './idb.js'

describe.skipIf(import.meta.env.TEST_ENV !== 'browser')('IdbStorage', () => {
    const idbName = 'mtcute_test_' + Math.random().toString(36).slice(2)

    const storage = new IdbStorage(idbName)
    testStorage(storage)
    testStateStorage(storage)

    afterAll(async () => {
        storage.destroy()

        const req = indexedDB.deleteDatabase(idbName)
        await new Promise<void>((resolve, reject) => {
            req.onerror = () => reject(req.error)
            req.onsuccess = () => resolve()
            req.onblocked = () => resolve()
        })
    })
})
