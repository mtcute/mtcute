import { afterEach, describe, expect, it, vi } from 'vitest'
import type { IReferenceMessagesRepository, IStorageDriver } from '@mtcute/core'

export function fakeRefMessagesRepository(): IReferenceMessagesRepository {
    return {
        store: vi.fn(),
        getByPeer: vi.fn(),
        delete: vi.fn(),
        deleteByPeer: vi.fn(),
        deleteAll: vi.fn(),
    }
}

export function testRefMessagesRepository(repo: IReferenceMessagesRepository, driver: IStorageDriver): void {
    describe('IReferenceMessagesRepository', () => {
        afterEach(() => repo.deleteAll())

        it('should be empty by default', async () => {
            expect(await repo.getByPeer(1)).toEqual(null)
        })

        it('should store and retrieve reference messages', async () => {
            await repo.store(1, 2, 3)
            await repo.store(1, 4, 5)
            await repo.store(2, 6, 7)
            await driver.save?.()

            expect(await repo.getByPeer(1)).deep.oneOf([
                [2, 3],
                [4, 5],
            ])
            expect(await repo.getByPeer(2)).toEqual([6, 7])
            expect(await repo.getByPeer(3)).toEqual(null)
            expect(await repo.getByPeer(4)).toEqual(null)
            expect(await repo.getByPeer(5)).toEqual(null)
            expect(await repo.getByPeer(6)).toEqual(null)
            expect(await repo.getByPeer(7)).toEqual(null)
        })

        it('should delete reference messages', async () => {
            await repo.store(1, 2, 3)
            await repo.store(1, 4, 5)
            await repo.store(2, 6, 7)
            await driver.save?.()

            await repo.delete(4, [5])
            await driver.save?.()
            expect(await repo.getByPeer(1)).toEqual([2, 3])

            await repo.delete(2, [2, 3, 4])
            await driver.save?.()
            expect(await repo.getByPeer(1)).toEqual(null)
        })

        it('should delete all reference messages for a peer', async () => {
            await repo.store(1, 2, 3)
            await repo.store(1, 4, 5)
            await repo.store(1, 6, 7)

            await repo.store(2, 20, 30)
            await repo.store(2, 40, 50)
            await repo.store(2, 60, 70)
            await driver.save?.()

            await repo.deleteByPeer(1)
            await driver.save?.()
            expect(await repo.getByPeer(1)).toEqual(null)
            expect(await repo.getByPeer(2)).deep.oneOf([
                [20, 30],
                [40, 50],
                [60, 70],
            ])
        })
    })
}
