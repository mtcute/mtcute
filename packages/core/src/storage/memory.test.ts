import { describe, expect, it } from 'vitest'

import { MemoryStorage } from './memory.js'
import { testStateStorage, testStorage } from './storage.test-utils.js'

describe('MemoryStorage', () => {
    testStorage(new MemoryStorage())
    testStateStorage(new MemoryStorage())

    describe('extending', () => {
        it('should allow populating from an object', () => {
            class ExtendedMemoryStorage extends MemoryStorage {
                constructor() {
                    super()
                    this._setStateFrom({
                        $version: 1,
                        defaultDcs: null,
                        authKeys: new Map(),
                        authKeysTemp: new Map(),
                        authKeysTempExpiry: new Map(),
                        entities: new Map(),
                        phoneIndex: new Map(),
                        usernameIndex: new Map(),
                        gpts: [1, 2, 3, 4],
                        pts: new Map(),
                        fsm: new Map(),
                        rl: new Map(),
                        self: null,
                    })
                }
            }

            const s = new ExtendedMemoryStorage()

            expect(s.getUpdatesState()).toEqual([1, 2, 3, 4])
        })

        it('should silently fail if version is wrong', () => {
            class ExtendedMemoryStorage extends MemoryStorage {
                constructor() {
                    super()
                    // eslint-disable-next-line
                    this._setStateFrom({ $version: 0 } as any)
                }
            }

            const s = new ExtendedMemoryStorage()

            expect(s.getUpdatesState()).toEqual(null)
        })
    })
})
