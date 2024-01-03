import { afterEach, describe, expect, it, vi } from 'vitest'

import { IStorageDriver } from '../driver.js'
import { IKeyValueRepository } from './key-value.js'

export function fakeKeyValueRepository(): IKeyValueRepository {
    return {
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
        deleteAll: vi.fn(),
    }
}

function fixBuffer(buf: Uint8Array | null): Uint8Array | null {
    if (!buf) return buf

    // eslint-disable-next-line no-restricted-globals
    return typeof Buffer !== 'undefined' && buf instanceof Buffer ? new Uint8Array(buf) : buf
}

export function testKeyValueRepository(repo: IKeyValueRepository, driver: IStorageDriver) {
    describe('key-value', () => {
        afterEach(() => repo.deleteAll())

        it('should be empty by default', async () => {
            expect(fixBuffer(await repo.get('key'))).toEqual(null)
        })

        it('should store and retrieve values', async () => {
            await repo.set('key', new Uint8Array([1, 2, 3]))
            await driver.save?.()

            expect(fixBuffer(await repo.get('key'))).toEqual(new Uint8Array([1, 2, 3]))
        })

        it('should delete values', async () => {
            await repo.set('key', new Uint8Array([1, 2, 3]))
            await driver.save?.()

            await repo.delete('key')
            await driver.save?.()

            expect(fixBuffer(await repo.get('key'))).toEqual(null)
        })
    })
}
