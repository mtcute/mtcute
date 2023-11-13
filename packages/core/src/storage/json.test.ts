import { describe, expect, it } from 'vitest'

import { stubPeerUser } from '@mtcute/test'

import { JsonMemoryStorage } from './json.js'

describe('JsonMemoryStorage', () => {
    class ExtJsonMemoryStorage extends JsonMemoryStorage {
        loadJson(json: string): void {
            this._loadJson(json)
        }

        saveJson(): string {
            return this._saveJson()
        }

        getInternalState() {
            return this._state
        }
    }

    it('should allow importing and exporting to json', () => {
        const s = new ExtJsonMemoryStorage()

        s.setUpdatesPts(123)
        s.setUpdatesQts(456)
        // eslint-disable-next-line no-restricted-globals
        s.setAuthKeyFor(1, Buffer.from([1, 2, 3]))
        // eslint-disable-next-line no-restricted-globals
        s.setTempAuthKeyFor(2, 0, Buffer.from([4, 5, 6]), 1234567890)
        s.setState('someState', 'someValue')
        s.updatePeers([{ ...stubPeerUser, updated: 0 }])

        const json = s.saveJson()
        const s2 = new ExtJsonMemoryStorage()
        s2.loadJson(json)

        expect(s2.getInternalState()).toEqual({
            ...s.getInternalState(),
            entities: new Map(), // entities are not saved
        })
    })
})
