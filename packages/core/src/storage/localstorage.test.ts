import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { LocalstorageStorage } from './localstorage.js'

const localStorageStub = {
    getItem: vi.fn().mockImplementation(() => null),
    setItem: vi.fn(),
}
describe('LocalstorageStorage', () => {
    beforeAll(() => void vi.stubGlobal('localStorage', localStorageStub))
    afterAll(() => void vi.unstubAllGlobals())

    it('should load from localstorage', () => {
        const s = new LocalstorageStorage('test')
        s.load()

        expect(localStorageStub.getItem).toHaveBeenCalledWith('test')
    })

    it('should save to localstorage', () => {
        const s = new LocalstorageStorage('test')
        s.save()

        expect(localStorageStub.setItem).toHaveBeenCalledWith('test', expect.any(String))
    })
})
