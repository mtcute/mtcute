import { describe } from 'vitest'

import {
    testAuthKeysRepository,
    testKeyValueRepository,
    testPeersRepository,
    testRefMessagesRepository,
} from '@mtcute/test'

import { MemoryStorage } from './index.js'

describe('memory storage', () => {
    const storage = new MemoryStorage()

    testAuthKeysRepository(storage.authKeys)
    testKeyValueRepository(storage.kv, storage.driver)
    testPeersRepository(storage.peers, storage.driver)
    testRefMessagesRepository(storage.refMessages, storage.driver)
})
