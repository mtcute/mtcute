import { afterEach, describe, expect, it, vi } from 'vitest'

import { IAuthKeysRepository } from '@mtcute/core'

export function fakeAuthKeysRepository(): IAuthKeysRepository {
    return {
        get: vi.fn(),
        set: vi.fn(),
        getTemp: vi.fn(),
        setTemp: vi.fn(),
        deleteByDc: vi.fn(),
        deleteAll: vi.fn(),
    }
}

function fixBuffer(buf: Uint8Array | null): Uint8Array | null {
    if (!buf) return buf

    // eslint-disable-next-line no-restricted-globals
    return typeof Buffer !== 'undefined' && buf instanceof Buffer ? new Uint8Array(buf) : buf
}

export function testAuthKeysRepository(repo: IAuthKeysRepository) {
    const key2 = new Uint8Array(256).fill(0x42)
    const key3 = new Uint8Array(256).fill(0x43)

    const key2i0 = new Uint8Array(256).fill(0x44)
    const key2i1 = new Uint8Array(256).fill(0x45)
    const key3i0 = new Uint8Array(256).fill(0x46)
    const key3i1 = new Uint8Array(256).fill(0x47)

    describe('auth keys', () => {
        afterEach(() => repo.deleteAll())

        it('should be empty by default', async () => {
            expect(fixBuffer(await repo.get(2))).toEqual(null)
            expect(fixBuffer(await repo.get(3))).toEqual(null)
        })

        it('should store and retrieve auth keys', async () => {
            await repo.set(2, key2)
            await repo.set(3, key3)

            expect(fixBuffer(await repo.get(2))).toEqual(key2)
            expect(fixBuffer(await repo.get(3))).toEqual(key3)
        })

        it('should delete auth keys', async () => {
            await repo.set(2, key2)
            await repo.set(3, key3)

            await repo.set(2, null)
            await repo.set(3, null)

            expect(fixBuffer(await repo.get(2))).toEqual(null)
            expect(fixBuffer(await repo.get(3))).toEqual(null)
        })

        it('should store and retrieve temp auth keys', async () => {
            await repo.setTemp(2, 0, key2i0, 1)
            await repo.setTemp(2, 1, key2i1, 1)
            await repo.setTemp(3, 0, key3i0, 1)
            await repo.setTemp(3, 1, key3i1, 1)

            expect(fixBuffer(await repo.getTemp(2, 0, 0))).toEqual(key2i0)
            expect(fixBuffer(await repo.getTemp(2, 1, 0))).toEqual(key2i1)
            expect(fixBuffer(await repo.getTemp(3, 0, 0))).toEqual(key3i0)
            expect(fixBuffer(await repo.getTemp(3, 1, 0))).toEqual(key3i1)

            expect(fixBuffer(await repo.getTemp(2, 0, 100))).toEqual(null)
            expect(fixBuffer(await repo.getTemp(2, 1, 100))).toEqual(null)
            expect(fixBuffer(await repo.getTemp(3, 0, 100))).toEqual(null)
            expect(fixBuffer(await repo.getTemp(3, 1, 100))).toEqual(null)
        })

        it('should delete temp auth keys', async () => {
            await repo.setTemp(2, 0, key2i0, 1)
            await repo.setTemp(2, 1, key2i1, 1)
            await repo.setTemp(3, 0, key3i0, 1)
            await repo.setTemp(3, 1, key3i1, 1)

            await repo.setTemp(2, 0, null, 1)
            await repo.setTemp(2, 1, null, 1)
            await repo.setTemp(3, 0, null, 1)
            await repo.setTemp(3, 1, null, 1)

            expect(fixBuffer(await repo.getTemp(2, 0, 0))).toEqual(null)
            expect(fixBuffer(await repo.getTemp(2, 1, 0))).toEqual(null)
            expect(fixBuffer(await repo.getTemp(3, 0, 0))).toEqual(null)
            expect(fixBuffer(await repo.getTemp(3, 1, 0))).toEqual(null)
        })

        it('should delete all auth keys by DC', async () => {
            await repo.set(2, key2)
            await repo.set(3, key3)

            await repo.setTemp(2, 0, key2i0, 1)
            await repo.setTemp(2, 1, key2i1, 1)
            await repo.setTemp(3, 0, key3i0, 1)
            await repo.setTemp(3, 1, key3i1, 1)

            await repo.deleteByDc(2)

            expect(fixBuffer(await repo.get(2))).toEqual(null)
            expect(fixBuffer(await repo.get(3))).toEqual(key3)

            expect(fixBuffer(await repo.getTemp(2, 0, 0))).toEqual(null)
            expect(fixBuffer(await repo.getTemp(2, 1, 0))).toEqual(null)
            expect(fixBuffer(await repo.getTemp(3, 0, 0))).toEqual(key3i0)
            expect(fixBuffer(await repo.getTemp(3, 1, 0))).toEqual(key3i1)
        })
    })
}
